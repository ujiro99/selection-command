import {
  isDebug,
  LINK_COMMAND_ENABLED,
  POPUP_ENABLED,
  OPTION_PAGE_PATH,
  SHORTCUT_NO_SELECTION_BEHAVIOR,
  HUB_URL,
  SCREEN,
} from "@/const"
import { executeActionProps } from "@/services/contextMenus"
import { Ipc, BgCommand, TabCommand, CONNECTION_APP } from "@/services/ipc"
import { Settings } from "@/services/settings/settings"
import { enhancedSettings } from "@/services/settings/enhancedSettings"
import { PopupOption, PopupPlacement } from "@/services/option/defaultSettings"
import * as PageActionBackground from "@/services/pageAction/background"
import { BgData } from "@/services/backgroundData"
import { ContextMenu } from "@/services/contextMenus"
import { closeWindow, windowExists } from "@/services/chrome"
import { WindowStackManager } from "@/services/windowStackManager"
import { isSearchCommand, isPageActionCommand } from "@/lib/utils"
import { execute } from "@/action/background"
import * as ActionHelper from "@/action/helper"
import type { IpcCallback } from "@/services/ipc"
import type { WindowType } from "@/types"
import { Storage, SESSION_STORAGE_KEY } from "@/services/storage"
import { updateActiveScreenId } from "@/services/screen"
import { ANALYTICS_EVENTS, sendEvent } from "@/services/analytics"

import { importIf } from "@import-if"
importIf("production", "./lib/sentry/initialize")

BgData.init()

type Sender = chrome.runtime.MessageSender

// Popup auto-close delay timer
let popupAutoCloseTimer: NodeJS.Timeout | null = null

export type addPageRuleProps = {
  url: string
}

type addCommandProps = {
  command: string
}

const getTabId = (
  _: unknown,
  sender: Sender,
  response: (res: unknown) => void,
) => {
  response(sender.tab?.id)
  return false
}

const onConnect = async function (port: chrome.runtime.Port) {
  if (port.name !== CONNECTION_APP) return
  port.onDisconnect.addListener(() => onDisconnect(port))
  const tabId = port.sender?.tab?.id
  if (tabId) {
    BgData.update((data) => ({
      connectedTabs: [...data.connectedTabs, tabId],
    }))
  }
}
const onDisconnect = async function (port: chrome.runtime.Port) {
  if (port.name !== CONNECTION_APP) return
  if (chrome.runtime.lastError) {
    if (
      !chrome.runtime.lastError.message?.match("moved into back/forward cache")
    ) {
      console.warn("Connection error:", chrome.runtime.lastError.message)
    }
  }
  const tabId = port.sender?.tab?.id
  if (tabId) {
    BgData.update((data) => ({
      connectedTabs: data.connectedTabs.filter((id) => id !== tabId),
    }))
  }
}
chrome.runtime.onConnect.addListener(onConnect)

const commandFuncs = {
  [BgCommand.openPopup]: ActionHelper.openPopup,
  [BgCommand.openPopups]: ActionHelper.openPopups,
  [BgCommand.openPopupAndClick]: ActionHelper.openPopupAndClick,
  [BgCommand.openTab]: ActionHelper.openTab,
  [BgCommand.execApi]: ActionHelper.execApi,

  [BgCommand.openOption]: (): boolean => {
    chrome.tabs.create({
      url: OPTION_PAGE_PATH,
    })
    return false
  },

  [BgCommand.openShortcuts]: (): boolean => {
    chrome.tabs.create({
      url: "chrome://extensions/shortcuts",
    })
    return false
  },

  [BgCommand.addPageRule]: (param: addPageRuleProps): boolean => {
    const add = async () => {
      const settings = await enhancedSettings.get()
      const pageRules = settings.pageRules ?? []
      if (pageRules.find((r) => r.urlPattern === param.url) == null) {
        pageRules.push({
          urlPattern: param.url,
          popupEnabled: POPUP_ENABLED.ENABLE,
          popupPlacement: PopupPlacement,
          linkCommandEnabled: LINK_COMMAND_ENABLED.INHERIT,
        })
      }
      await Settings.set(
        {
          ...settings,
          pageRules,
        },
        true,
      )
      chrome.tabs.create({
        url: `${OPTION_PAGE_PATH}#pageRules`,
      })
    }
    add()
    return false
  },

  [BgCommand.addCommand]: (
    param: addCommandProps,
    _: Sender,
    response: (res: unknown) => void,
  ): boolean => {
    const params = JSON.parse(param.command)
    const isSearch = isSearchCommand(params)
    const isPageAction = isPageActionCommand(params)

    const cmd = isSearch
      ? {
          id: params.id,
          title: params.title,
          searchUrl: params.searchUrl,
          iconUrl: params.iconUrl,
          openMode: params.openMode,
          openModeSecondary: params.openModeSecondary,
          spaceEncoding: params.spaceEncoding,
          popupOption: PopupOption,
        }
      : isPageAction
        ? {
            id: params.id,
            title: params.title,
            iconUrl: params.iconUrl,
            openMode: params.openMode,
            pageActionOption: params.pageActionOption,
            popupOption: PopupOption,
          }
        : null

    if (!cmd) {
      console.error("invalid command", param.command)
      response(false)
      return true
    }

    Settings.addCommands([cmd]).then(() => {
      response(true)
    })
    return true
  },

  [BgCommand.canOpenInTab]: (
    _: unknown,
    sender: Sender,
    response: (res: unknown) => void,
  ) => {
    WindowStackManager.getStack().then((stack) => {
      for (const layer of stack) {
        for (const window of layer) {
          if (window.id === sender.tab?.windowId) {
            // found!
            response(true)
            return
          }
        }
      }
      response(false)
    })
    return true
  },

  [BgCommand.openInTab]: (
    _: unknown,
    sender: Sender,
    response: (res: unknown) => void,
  ) => {
    const handleOpenInTab = async () => {
      let w: WindowType | undefined

      const stack = await WindowStackManager.getStack()
      for (const layer of stack) {
        for (const window of layer) {
          if (window.id === sender.tab?.windowId) {
            w = window
            break
          }
        }
      }
      if (!w || w.srcWindowId == null) {
        console.warn("window not found", sender.tab?.windowId)
        chrome.tabs.create({ url: sender.url })
        await closeWindow(sender.tab?.windowId as number, "openInTab")
        await WindowStackManager.removeWindow(sender.tab?.windowId as number)
        response(true)
        return
      }

      let targetId: number | undefined
      const windowIdExists = await windowExists(w.srcWindowId)
      if (windowIdExists) {
        targetId = w.srcWindowId
      } else {
        const current = await chrome.windows.getCurrent()
        targetId = current.id
        console.warn(
          `source window(${w.srcWindowId}) not found, use current(${current.id}) instead.`,
        )
      }

      if (targetId) {
        chrome.tabs.create({
          url: sender.url,
          windowId: targetId,
        })
        await closeWindow(sender.tab?.windowId as number, "openInTab")
        await WindowStackManager.removeWindow(sender.tab?.windowId as number)
        response(true)
      } else {
        response(false)
      }
    }

    handleOpenInTab()
    return true
  },

  [BgCommand.onHidden]: (
    _param: any,
    sender: Sender,
    response: (res: unknown) => void,
  ) => {
    const handleOnHidden = async () => {
      const windowId = sender.tab?.windowId
      const tabId = sender.tab?.id
      if (!windowId || !tabId) {
        response(true)
        return
      }

      const stack = await WindowStackManager.getStack()

      const src = stack.find((s) => s.find((w) => w.srcWindowId === windowId))
      if (src) {
        // Do nothing when the window is src window.
        response(true)
        return
      }

      const layer = stack.find((s) => s.find((w) => w.id === windowId))
      if (!layer || layer.length > 1) {
        // Do nothing when the window isn't in the layer or multiple links are opened.
        response(true)
        return
      }

      // Remove the window.
      await closeWindow(windowId, "onHidden")
      await WindowStackManager.removeWindow(windowId)
      response(false)
    }

    handleOnHidden()
    return true
  },

  [BgCommand.toggleStar]: (
    param: { id: string },
    _: Sender,
    response: (res: unknown) => void,
  ): boolean => {
    const toggle = async () => {
      const settings = await enhancedSettings.get()
      const idx = settings.stars.findIndex((s) => s.id === param.id)
      if (idx >= 0) {
        settings.stars.splice(idx, 1)
      } else {
        settings.stars.push({
          id: param.id,
        })
      }
      await Settings.set(settings, true)
      response(true)
    }
    toggle()
    return true
  },

  [BgCommand.getTabId]: getTabId,

  //
  // PageAction
  //
  [BgCommand.addPageAction]: PageActionBackground.add,
  [BgCommand.updatePageAction]: PageActionBackground.update,
  [BgCommand.removePageAction]: PageActionBackground.remove,
  [BgCommand.resetPageAction]: PageActionBackground.reset,
  [BgCommand.startPageActionRecorder]: PageActionBackground.openRecorder,
  [BgCommand.finishPageActionRecorder]: PageActionBackground.closeRecorder,
  [BgCommand.previewPageAction]: PageActionBackground.preview,
  [BgCommand.stopPageAction]: PageActionBackground.stopRunner,
  [BgCommand.openAndRunPageAction]: PageActionBackground.openAndRun,
} as { [key: string]: IpcCallback }

for (const key in BgCommand) {
  const command = BgCommand[key as keyof typeof BgCommand]
  Ipc.addListener(command, commandFuncs[key])
}

const updateWindowSize = async (
  commandId: string,
  width: number,
  height: number,
) => {
  const obj = await enhancedSettings.get()
  const found = obj.commands.find((c) => c.id === commandId)
  if (found) {
    found.popupOption = {
      width,
      height,
    }
    await Settings.updateCommands([found])
  } else {
    console.warn("command not found", commandId)
  }
}

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({
    url: OPTION_PAGE_PATH,
  })
})

chrome.windows.onFocusChanged.addListener(async (windowId: number) => {
  // Clear selection text
  await Storage.set(SESSION_STORAGE_KEY.SELECTION_TEXT, "")

  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    return
  }

  // Update active screen ID
  await updateActiveScreenId(windowId)

  // Get windows to close based on focus change
  const windowsToClose = await WindowStackManager.getWindowsToClose(windowId)

  // If there are no windows to close, cancel any pending auto-close timer
  if (windowsToClose.length === 0) {
    if (popupAutoCloseTimer !== null) {
      clearTimeout(popupAutoCloseTimer)
      popupAutoCloseTimer = null
    }
    return
  }

  // Cancel any existing timer
  if (popupAutoCloseTimer !== null) {
    clearTimeout(popupAutoCloseTimer)
    popupAutoCloseTimer = null
  }

  // Get the auto-close delay setting
  const settings = await Settings.get()
  const autoCloseDelay = settings.popupAutoCloseDelay

  // Define the close function
  const closeWindows = async () => {
    for (const window of windowsToClose) {
      await closeWindow(window.id, "onFocusChanged")
      await WindowStackManager.removeWindow(window.id)
    }
    popupAutoCloseTimer = null
  }

  // Execute close based on delay setting
  if (autoCloseDelay != null && autoCloseDelay > 0) {
    // Delayed close: Set timeout
    popupAutoCloseTimer = setTimeout(closeWindows, autoCloseDelay)
  } else {
    // Immediate close: No delay configured
    await closeWindows()
  }
})

chrome.windows.onRemoved.addListener((windowId: number) => {
  const data = BgData.get()
  const normalWindows = data.normalWindows ?? []
  const idx = normalWindows.findIndex((w) => w.id === windowId)

  if (idx >= 0) {
    normalWindows.splice(idx, 1)
    BgData.set((data) => ({
      ...data,
      normalWindows,
    }))
  }
})

chrome.windows.onBoundsChanged.addListener(async (window) => {
  const data = BgData.get()
  const windowStack = await WindowStackManager.getStack()
  for (const layer of [...windowStack, data.normalWindows]) {
    const w = layer.find((v) => v.id === window.id)
    if (w) {
      if (w.id === window.id && window.width && window.height) {
        updateWindowSize(w.commandId, window.width, window.height)
        return
      }
    }
  }
})

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  // Force close the menu
  try {
    const ret = await Ipc.sendAllTab(TabCommand.closeMenu)
    ret.filter((v) => v).forEach((v) => console.debug(v))
  } catch (error) {
    console.error("Failed to close menu:", error)
  }

  // Get the active tab's window and update screen ID
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId)
    if (tab.windowId) {
      await updateActiveScreenId(tab.windowId)
    }
  } catch (error) {
    console.error("Failed to get active screen ID:", error)
  }
})

if (isDebug) {
  chrome.action.setIcon({
    path: {
      128: "/icon128-dev.png",
    },
  })
}

chrome.runtime.onInstalled.addListener((details) => {
  ContextMenu.init()

  chrome.storage.session.setAccessLevel({
    accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS",
  })

  if (
    details.reason === chrome.runtime.OnInstalledReason.INSTALL ||
    details.reason === chrome.runtime.OnInstalledReason.UPDATE
  ) {
    // Set uninstall survey URL
    chrome.runtime.setUninstallURL(`${HUB_URL}/uninstall`)
  }

  // Check for daily backup on startup
  checkAndPerformDailyBackup()

  // Check for weekly backup on startup
  checkAndPerformWeeklyBackup()
})

chrome.runtime.onStartup.addListener(() => {
  console.debug("Service worker started")

  // Check for daily backup on browser startup
  checkAndPerformDailyBackup()

  // Check for weekly backup on browser startup
  checkAndPerformWeeklyBackup()

  // Check for legacy backup on startup
  checkAndPerformLegacyBackup()
})

// Daily backup check function
const checkAndPerformDailyBackup = async () => {
  try {
    const dailyBackupManager = Storage.dailyBackupManager
    if (await dailyBackupManager.shouldBackup()) {
      await dailyBackupManager.performBackup()
    }
  } catch (error) {
    console.error("Failed to perform daily backup check:", error)
  }
}

// Weekly backup check function
const checkAndPerformWeeklyBackup = async () => {
  try {
    const weeklyBackupManager = Storage.weeklyBackupManager
    if (await weeklyBackupManager.shouldBackup()) {
      await weeklyBackupManager.performBackup()
    }
  } catch (error) {
    console.error("Failed to perform weekly backup check:", error)
  }
}

// Legacy backup check function
const checkAndPerformLegacyBackup = async () => {
  try {
    const legacyBackupManager = Storage.legacyBackupManager
    if (await legacyBackupManager.shouldBackup()) {
      await legacyBackupManager.performBackup()
    }
  } catch (error) {
    console.error("Failed to perform legacy backup check:", error)
  }
}

// Initialize commandIdObj and register listener at top-level
// to ensure they are available when service worker restarts
;(async () => {
  try {
    await ContextMenu.syncCommandIdObj()
    chrome.contextMenus.onClicked.addListener(ContextMenu.onClicked)
  } catch (error) {
    // Ignore errors during initialization (e.g., in test environment)
    console.debug("Failed to initialize context menu listener:", error)
  }
})()

Settings.addChangedListener(() => ContextMenu.init())

// for debug
// chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(
//   (details: chrome.declarativeNetRequest.MatchedRuleInfoDebug) => {
//     console.debug(details)
//   },
// )

// Add command processing
chrome.commands.onCommand.addListener(async (commandName) => {
  try {
    // Get settings
    const settings = await enhancedSettings.get()
    const shortcut = settings.shortcuts?.shortcuts.find(
      (shortcut) => shortcut.id === commandName,
    )

    if (!shortcut) {
      console.warn(`No shortcut mapped for command: ${commandName}`)
      return
    }

    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    const command = settings.commands.find((c) => c.id === shortcut.commandId)
    if (!command) {
      console.warn(`Command not found: ${shortcut.commandId}`)
      return
    }

    const enableSendTab =
      tab?.id &&
      !tab.url?.startsWith("chrome") &&
      !tab.url?.includes("chromewebstore.google.com")

    const selectionText = await Storage.get<string>(
      SESSION_STORAGE_KEY.SELECTION_TEXT,
    )

    // If no text is selected, handle according to noSelectionBehavior
    let useClipboard = false
    if (!selectionText) {
      if (
        shortcut.noSelectionBehavior ===
        SHORTCUT_NO_SELECTION_BEHAVIOR.DO_NOTHING
      ) {
        return
      } else if (
        shortcut.noSelectionBehavior ===
        SHORTCUT_NO_SELECTION_BEHAVIOR.USE_CLIPBOARD
      ) {
        useClipboard = true
      }
    }

    let ret: unknown
    if (enableSendTab) {
      // Execute command in tab
      ret = await Ipc.sendTab<executeActionProps>(
        tab?.id ?? 0,
        TabCommand.executeAction,
        {
          command,
          useClipboard,
        },
      )
    }

    if (!enableSendTab || ret instanceof Error) {
      // Execute command directly in background
      await execute({
        command,
        position: { x: 10000, y: 10000 },
        selectionText,
        target: null,
        useClipboard,
      })
    }
    sendEvent(
      ANALYTICS_EVENTS.SHORTCUT,
      {
        event_label: command.openMode,
      },
      SCREEN.SERVICE_WORKER,
    )
  } catch (error) {
    console.error("Failed to execute shortcut command:", error)
  }
})

// Export functions for testing
export const testExports = {
  commandFuncs,
  updateWindowSize,
}

self.addEventListener("error", (event) => {
  console.error("error", event)
})

self.addEventListener("unhandledrejection", (event) => {
  console.error("unhandledrejection", event)
})
