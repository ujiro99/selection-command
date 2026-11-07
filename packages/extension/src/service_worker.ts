import { isDebug, OPTION_PAGE_PATH } from "@/const"
import {
  Ipc,
  ServiceWorkerCommand,
  TabCommand,
  CONNECTION_APP,
} from "@/services/ipc"
import type { IpcCallback, ZoomChangedProps } from "@/services/ipc"
import { Settings } from "@/services/settings/settings"
import { enhancedSettings } from "@/services/settings/enhancedSettings"
import { CACHE_SECTIONS } from "@/services/settings/settingsCache"
import * as PageActionServiceWorker from "@/services/pageAction/serviceWorker"
import { ServiceWorkerData } from "@/services/serviceWorkerData"
import { ContextMenu } from "@/services/contextMenus"
import {
  closeWindow,
  windowExists,
  getCurrentTab,
  openOptionPage,
} from "@/services/chrome"
import { WindowStackManager } from "@/services/windowStackManager"
import { PopupAutoClose } from "@/services/popupAutoClose"
import { findMatchingPageRule } from "@/lib/url"
import * as ActionHelper from "@/action/helper"
import type { WindowType } from "@/types"
import * as HubServiceWorker from "@/services/hub/serviceWorker"
import * as IconColorServiceWorker from "@/services/iconColor/serviceWorker"
import { getSidePanelEvent } from "@/services/sidePanelSupport"
import { registerLifecycleListeners } from "@/services/lifecycle/serviceWorker"
import { registerShortcutListeners } from "@/services/shortcut/serviceWorker"

import { importIf } from "@import-if"
importIf("production", "./lib/sentry/initialize")

ServiceWorkerData.init()

// Must run synchronously: an event that wakes the service worker is lost when
// its listener is registered after an await.
registerLifecycleListeners()
registerShortcutListeners()

type Sender = chrome.runtime.MessageSender

export type addPageRuleProps = {
  url: string
}

const getTabId = (
  _: unknown,
  sender: Sender,
  response: (res: unknown) => void,
) => {
  response(sender.tab?.id)
  return false
}

const getZoom = (
  _: unknown,
  sender: Sender,
  response: (res: unknown) => void,
) => {
  const tabId = sender.tab?.id
  if (tabId == null) {
    response(1)
    return false
  }
  chrome.tabs
    .getZoom(tabId)
    .then((zoomFactor) => response(zoomFactor))
    .catch((error) => {
      console.warn("Failed to get zoom:", error)
      response(1)
    })
  return true
}

const getActiveTabId = (
  _: unknown,
  _sender: Sender,
  response: (res: unknown) => void,
) => {
  getCurrentTab().then((tab) => response(tab?.id))
  return true
}

// Closes the sender's own tab. Routed through the service worker (rather
// than the page calling chrome.tabs.remove() on itself) since a page closing
// its own tab is the more robust pattern - it keeps tab lifecycle decisions
// in one place alongside the rest of the extension's tab management.
//
// Responds *before* removing the tab, not after: the sender is awaiting this
// response in the very tab we're about to close, so if the response only
// arrived once chrome.tabs.remove() had resolved, that await would be racing
// its own tab's teardown. Acknowledging first lets the sender's promise
// settle cleanly while its tab is still fully alive; the removal itself
// follows as a fire-and-forget side effect.
const closeTab = (
  _: unknown,
  sender: Sender,
  response: (res: unknown) => void,
) => {
  const tabId = sender.tab?.id
  response(tabId != null)
  if (tabId != null) {
    chrome.tabs.remove(tabId)
  }
  return false
}

const onConnect = async function (port: chrome.runtime.Port) {
  if (port.name !== CONNECTION_APP) return
  port.onDisconnect.addListener(() => onDisconnect(port))
  const tabId = port.sender?.tab?.id
  if (tabId) {
    ServiceWorkerData.update((data) => ({
      connectedTabs: [...data.connectedTabs, tabId],
    }))
  } else {
    // Side panel pages have no tab.id (port.sender.origin is set instead).
    await PageActionServiceWorker.handleSidePanelConnect(port)
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
    ServiceWorkerData.update((data) => ({
      connectedTabs: data.connectedTabs.filter((id) => id !== tabId),
    }))
  }
}
chrome.runtime.onConnect.addListener(onConnect)

const commandFuncs = {
  [ServiceWorkerCommand.openPopup]: ActionHelper.openPopup,
  [ServiceWorkerCommand.openPopups]: ActionHelper.openPopups,
  [ServiceWorkerCommand.openPopupAndClick]: ActionHelper.openPopupAndClick,
  [ServiceWorkerCommand.openTab]: ActionHelper.openTab,
  [ServiceWorkerCommand.openTabs]: ActionHelper.openTabs,
  [ServiceWorkerCommand.openSidePanel]: (
    param: Parameters<typeof ActionHelper.openSidePanel>[0],
    sender: Sender,
    response: (res: unknown) => void,
  ): boolean => {
    return ActionHelper.openSidePanel(
      param,
      sender,
      async (result: unknown) => {
        // If the side panel was already open (port retained), execute pending action
        // via the existing port without waiting for a new onConnect event.
        if (result === true) {
          await PageActionServiceWorker.handleSidePanelOpened()
        }
        response(result)
      },
    )
  },
  [ServiceWorkerCommand.closeSidePanel]: ActionHelper.closeSidePanel,
  [ServiceWorkerCommand.navigateSidePanel]: ActionHelper.navigateSidePanel,
  [ServiceWorkerCommand.execApi]: ActionHelper.execApi,

  [ServiceWorkerCommand.openOption]: (): boolean => {
    openOptionPage().catch((e) =>
      console.error("Failed to open option page", e),
    )
    return false
  },

  [ServiceWorkerCommand.openShortcuts]: (): boolean => {
    chrome.tabs.create({
      url: "chrome://extensions/shortcuts",
    })
    return false
  },

  [ServiceWorkerCommand.addPageRule]: (param: addPageRuleProps): boolean => {
    const add = async () => {
      const settings = await enhancedSettings.get()
      const pageRules = settings.pageRules ?? []
      const matchingRule = findMatchingPageRule(pageRules, param.url)
      if (matchingRule == null) {
        await openOptionPage(
          `${OPTION_PAGE_PATH}?addPageRule=${encodeURIComponent(param.url)}#pageRules`,
        )
      } else {
        await openOptionPage(
          `${OPTION_PAGE_PATH}?editPageRule=${encodeURIComponent(matchingRule.urlPattern)}#pageRules`,
        )
      }
    }
    add().catch((e) => console.error("Failed to open option page", e))
    return false
  },

  [ServiceWorkerCommand.canOpenInTab]: (
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

  [ServiceWorkerCommand.openInTab]: (
    _: unknown,
    sender: Sender,
    response: (res: unknown) => void,
  ) => {
    const handleOpenInTab = async () => {
      let w: WindowType | undefined
      const targetUrl = sender.tab?.url ?? sender.url

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
        chrome.tabs.create({ url: targetUrl })
        await closeWindow(sender.tab?.windowId as number, "openInTab")
        await WindowStackManager.removeWindow(sender.tab?.windowId as number)
        response(true)
        return
      }

      let targetId: number | undefined
      const { exists } = await windowExists(w.srcWindowId)
      if (exists) {
        targetId = w.srcWindowId
      } else {
        const current = await chrome.windows.getCurrent()
        targetId = current.id
        console.warn(
          `source window(${w.srcWindowId}) not found, use current(${current.id}) instead.`,
        )
      }

      if (targetId) {
        chrome.tabs.create({ url: targetUrl, windowId: targetId })
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

  [ServiceWorkerCommand.onHidden]: (
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

      // Schedule popup window to close with configured delay
      const window = layer.find((w) => w.id === windowId)
      if (window) {
        await PopupAutoClose.scheduleClose([window], "onHidden")
      }
      response(false)
    }

    handleOnHidden()
    return true
  },

  [ServiceWorkerCommand.toggleStar]: (
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

  [ServiceWorkerCommand.getTabId]: getTabId,
  [ServiceWorkerCommand.getActiveTabId]: getActiveTabId,
  [ServiceWorkerCommand.getZoom]: getZoom,
  [ServiceWorkerCommand.closeTab]: closeTab,
  [ServiceWorkerCommand.resolveIconColors]:
    IconColorServiceWorker.resolveIconColors,

  //
  // Hub
  //
  [ServiceWorkerCommand.shareCommandToHub]: HubServiceWorker.shareCommandToHub,
  [ServiceWorkerCommand.editCommandToHub]: HubServiceWorker.editCommandToHub,
  [ServiceWorkerCommand.pushEditToHub]: HubServiceWorker.pushEditToHub,
  [ServiceWorkerCommand.getSharedCommandIds]:
    HubServiceWorker.getSharedCommandIds,

  //
  // PageAction
  //
  [ServiceWorkerCommand.addPageAction]: PageActionServiceWorker.add,
  [ServiceWorkerCommand.updatePageAction]: PageActionServiceWorker.update,
  [ServiceWorkerCommand.removePageAction]: PageActionServiceWorker.remove,
  [ServiceWorkerCommand.resetPageAction]: PageActionServiceWorker.reset,
  [ServiceWorkerCommand.startPageActionRecorder]:
    PageActionServiceWorker.openRecorder,
  [ServiceWorkerCommand.finishPageActionRecorder]:
    PageActionServiceWorker.closeRecorder,
  [ServiceWorkerCommand.previewPageAction]: PageActionServiceWorker.preview,
  [ServiceWorkerCommand.stopPageAction]: PageActionServiceWorker.stopRunner,
  [ServiceWorkerCommand.openAndRunPageAction]:
    PageActionServiceWorker.openAndRun,
} as { [key: string]: IpcCallback }

for (const key in ServiceWorkerCommand) {
  const command = ServiceWorkerCommand[key as keyof typeof ServiceWorkerCommand]
  Ipc.addListener(command, commandFuncs[key])
}

HubServiceWorker.initHubExternalListener()

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

const updateActiveTabId = async (activeTabId?: number) => {
  if (activeTabId == null) {
    const activeTab = await getCurrentTab()
    activeTabId = activeTab?.id
  }
  if (activeTabId != null) {
    await ServiceWorkerData.update({ activeTabId })
  }
}

chrome.action.onClicked.addListener(() => {
  openOptionPage().catch((e) => console.error("Failed to open option page", e))
})

chrome.windows.onFocusChanged.addListener(async (windowId: number) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return

  // Update active tab ID
  await updateActiveTabId()

  // Get windows to close based on focus change
  const windowsToClose = await WindowStackManager.getWindowsToClose(windowId)

  // Schedule popup windows to close with configured delay.
  await PopupAutoClose.scheduleClose(windowsToClose)
})

chrome.windows.onRemoved.addListener(async (windowId: number) => {
  // Wait for the persisted state so we never write back the empty default.
  await ServiceWorkerData.ready()
  const normalWindows = ServiceWorkerData.get().normalWindows ?? []
  if (!normalWindows.some((w) => w.id === windowId)) return

  // Compute from the latest state inside the updater.
  await ServiceWorkerData.update((data) => ({
    normalWindows: (data.normalWindows ?? []).filter((w) => w.id !== windowId),
  }))
})

chrome.windows.onBoundsChanged.addListener(async (window) => {
  await ServiceWorkerData.ready()
  const data = ServiceWorkerData.get()
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
  const settings = await enhancedSettings.getSection(
    CACHE_SECTIONS.USER_SETTINGS,
  )
  if (!settings.startupMethod?.keepMenuOpenOnFocusChange) {
    // Force close the menu
    try {
      const ret = await Ipc.sendAllTab(TabCommand.closeMenu)
      ret.filter((v) => v).forEach((v) => console.debug(v))
    } catch (error) {
      console.error("Failed to close menu:", error)
    }
  }

  try {
    await updateActiveTabId(activeInfo.tabId)
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

// Side panel is an optional capability (e.g. not available on Opera), so
// each event is feature-detected individually.
getSidePanelEvent("onOpened")?.addListener(async () => {
  const settings = await enhancedSettings.getSection(
    CACHE_SECTIONS.USER_SETTINGS,
  )
  if (!settings.startupMethod?.keepMenuOpenOnFocusChange) {
    // Force close the menu
    try {
      const ret = await Ipc.sendAllTab(TabCommand.closeMenu)
      ret.filter((v) => v).forEach((v) => console.debug(v))
    } catch (error) {
      console.error("Failed to close menu:", error)
    }
  }
})

// Let the content script cancel the browser zoom on the popup menu.
chrome.tabs.onZoomChange.addListener(({ tabId, newZoomFactor }) => {
  Ipc.sendTab<ZoomChangedProps>(tabId, TabCommand.zoomChanged, {
    zoomFactor: newZoomFactor,
  })
})

// SidePanel auto-hide functionality
// Track tabs with active side panels
chrome.tabs.onRemoved.addListener((tabId) => {
  ActionHelper.sidePanelClosed(tabId)
  updateActiveTabId()
})
getSidePanelEvent("onClosed")?.addListener(({ tabId }) =>
  ActionHelper.sidePanelClosed(tabId),
)

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
