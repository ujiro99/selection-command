import {
  isDebug,
  LINK_COMMAND_ENABLED,
  POPUP_ENABLED,
  OPTION_PAGE_PATH,
  SHORTCUT_NO_SELECTION_BEHAVIOR,
  HUB_URL,
  SCREEN,
} from '@/const'
import { executeActionProps } from '@/services/contextMenus'
import { Ipc, BgCommand, TabCommand } from '@/services/ipc'
import { Settings } from '@/services/settings'
import { PopupOption, PopupPlacement } from '@/services/option/defaultSettings'
import * as PageActionBackground from '@/services/pageAction/background'
import { BgData } from '@/services/backgroundData'
import { ContextMenu } from '@/services/contextMenus'
import { closeWindow } from '@/services/chrome'
import { isSearchCommand, isPageActionCommand } from '@/lib/utils'
import { execute } from '@/action/background'
import * as ActionHelper from '@/action/helper'
import type { IpcCallback } from '@/services/ipc'
import type {
  WindowType,
  WindowLayer,
  CaptureData,
  CaptureDataStorage,
  CaptureScreenShotRes,
} from '@/types'
import { Storage, SESSION_STORAGE_KEY } from '@/services/storage'
import { updateActiveScreenId } from '@/services/screen'
import { ANALYTICS_EVENTS, sendEvent } from './services/analytics'

BgData.init()

type Sender = chrome.runtime.MessageSender

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
  return true
}

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
      url: 'chrome://extensions/shortcuts',
    })
    return false
  },

  [BgCommand.addPageRule]: (param: addPageRuleProps): boolean => {
    const add = async () => {
      const settings = await Settings.get()
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
      console.error('invalid command', param.command)
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
  ): boolean => {
    const data = BgData.get()
    for (const layer of data.windowStack) {
      for (const window of layer) {
        if (window.id === sender.tab?.windowId) {
          // found!
          response(true)
          break
        }
      }
    }
    response(false)
    return false
  },

  [BgCommand.openInTab]: (
    _: unknown,
    sender: Sender,
    response: (res: unknown) => void,
  ): boolean => {
    let w: WindowType | undefined

    const data = BgData.get()
    for (const layer of data.windowStack) {
      for (const window of layer) {
        if (window.id === sender.tab?.windowId) {
          w = window
          break
        }
      }
    }
    if (!w || w.srcWindowId == null) {
      console.warn('window not found', sender.tab?.windowId)
      chrome.tabs.create({ url: sender.url })
      closeWindow(sender.tab?.windowId as number, 'openInTab').then(() => {
        response(true)
      })
      return true
    }

    let targetId: number | undefined
    chrome.windows
      .get(w.srcWindowId)
      .then((window) => {
        targetId = window.id
      })
      .catch(async () => {
        const current = await chrome.windows.getCurrent()
        targetId = current.id
        console.warn(
          `source window(${w.srcWindowId}) not found, use current(${current.id}) instead.`,
        )
      })
      .finally(() => {
        if (targetId) {
          chrome.tabs.create({
            url: sender.url,
            windowId: targetId,
          })
          closeWindow(sender.tab?.windowId as number, 'openInTab').then(() => {
            response(true)
          })
        } else {
          response(false)
        }
      })

    // return async
    return true
  },

  [BgCommand.onHidden]: (
    _param: any,
    sender: Sender,
    response: (res: unknown) => void,
  ): boolean => {
    const func = async () => {
      const stack = BgData.get().windowStack
      const windowId = sender.tab?.windowId
      const tabId = sender.tab?.id
      if (!windowId || !tabId) {
        response(true)
        return
      }

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
      await closeWindow(windowId, 'onHidden')
      layer.splice(
        layer.findIndex((w) => w.id === windowId),
        1,
      )
      await BgData.set((data) => ({
        ...data,
        windowStack: stack,
      }))
      response(false)
      return
    }

    func()
    return false
  },

  [BgCommand.toggleStar]: (
    param: { id: string },
    _: Sender,
    response: (res: unknown) => void,
  ): boolean => {
    const toggle = async () => {
      const settings = await Settings.get()
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

  [BgCommand.captureScreenshot]: (
    _,
    sender: Sender,
    response: (res: CaptureScreenShotRes) => void,
  ): boolean => {
    const tabId = sender.tab?.id
    const windowId = sender.tab?.windowId
    if (!tabId || !windowId) {
      response({ success: false, error: 'TabId or WindowId not found.' })
      return true
    }

    chrome.tabs.captureVisibleTab(windowId, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        response({ success: false, error: chrome.runtime.lastError.message })
        return
      }
      response({ success: true, data: dataUrl })
    })
    return true
  },

  [BgCommand.addCapture]: (
    param: CaptureData,
    _: Sender,
    response: (res: unknown) => void,
  ): boolean => {
    try {
      Storage.update<CaptureDataStorage>(
        SESSION_STORAGE_KEY.TMP_CAPTURES,
        (captures) => ({
          ...captures,
          [param.id]: param.data,
        }),
      ).then(() => {
        response(true)
      })
    } catch (e) {
      console.error(e)
      response(false)
    }
    return false
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
  const obj = await Settings.get()
  const found = obj.commands.find((c) => c.id === commandId)
  if (found) {
    found.popupOption = {
      width,
      height,
    }
    await Settings.updateCommands([found])
  } else {
    console.warn('command not found', commandId)
  }
}

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({
    url: OPTION_PAGE_PATH,
  })
})

chrome.windows.onFocusChanged.addListener(async (windowId: number) => {
  const data = BgData.get()
  let stack = data.windowStack

  // Clear selection text
  await Storage.set(SESSION_STORAGE_KEY.SELECTION_TEXT, '')

  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    return
  }

  // Update active screen ID
  await updateActiveScreenId(windowId)

  // Close popup windows when focus changed to lower stack window
  const idxs = stack.map((s) => s.findIndex((w) => w.id === windowId))
  let changed = false

  // Close all window.
  let closeStack = [] as WindowLayer[]
  const closeAll = idxs.every((i) => i < 0)
  if (closeAll && stack.length > 0) {
    closeStack = stack
    stack = []
    changed = true
  }

  // Close windows up to the window stack in focus.
  for (let i = idxs.length - 2; i >= 0; i--) {
    if (idxs[i] >= 0) {
      closeStack = stack.splice(i + 1)
      changed = true
      break
    }
  }

  // execute close
  if (closeStack.length > 0) {
    for (const layer of closeStack) {
      for (const window of layer) {
        await closeWindow(window.id, 'onFocusChanged')
      }
    }
  }

  if (changed) {
    await BgData.set((old) => ({
      ...old,
      windowStack: stack,
    }))
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

chrome.windows.onBoundsChanged.addListener((window) => {
  const data = BgData.get()
  for (const layer of [...data.windowStack, data.normalWindows]) {
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
    console.error('Failed to close menu:', error)
  }

  // Get the active tab's window and update screen ID
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId)
    if (tab.windowId) {
      await updateActiveScreenId(tab.windowId)
    }
  } catch (error) {
    console.error('Failed to get active screen ID:', error)
  }
})

if (isDebug) {
  chrome.action.setIcon({
    path: {
      128: '/icon128-dev.png',
    },
  })
}

chrome.runtime.onInstalled.addListener((details) => {
  ContextMenu.init()

  chrome.storage.session.setAccessLevel({
    accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS',
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
  // Check for daily backup on browser startup
  checkAndPerformDailyBackup()

  // Check for weekly backup on browser startup
  checkAndPerformWeeklyBackup()
})

// Daily backup check function
const checkAndPerformDailyBackup = async () => {
  try {
    const dailyBackupManager = Storage.dailyBackupManager
    if (await dailyBackupManager.shouldBackup()) {
      await dailyBackupManager.performDailyBackup()
    }
  } catch (error) {
    console.error('Failed to perform daily backup check:', error)
  }
}

// Weekly backup check function
const checkAndPerformWeeklyBackup = async () => {
  try {
    const weeklyBackupManager = Storage.weeklyBackupManager
    if (await weeklyBackupManager.shouldBackup()) {
      await weeklyBackupManager.performWeeklyBackup()
    }
  } catch (error) {
    console.error('Failed to perform weekly backup check:', error)
  }
}

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
    const settings = await Settings.get()
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
      !tab.url?.startsWith('chrome') &&
      !tab.url?.includes('chromewebstore.google.com')

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
    console.error('Failed to execute shortcut command:', error)
  }
})
