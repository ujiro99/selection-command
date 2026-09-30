import { escapeJson, toUrl } from "@/lib/utils"
import {
  openPopupWindow,
  openPopupWindowMultiple,
  openTab as openTabWithClipboard,
  openSidePanel as _openSidePanel,
  closeSidePanel as _closeSidePanel,
  updateSidePanelUrl as _updateSidePanelUrl,
  OpenPopupsProps,
  OpenPopupProps,
  OpenPopupAndClickProps,
  OpenTabProps,
  OpenSidePanelProps,
} from "@/services/chrome"
import { registerSidePanelTab } from "@/services/pageAction/serviceWorker-sidePanel"
import { incrementCommandExecutionCount } from "@/services/commandMetrics"
import { enhancedSettings } from "@/services/settings/enhancedSettings"
import { Ipc, TabCommand, NavigateSidePanelProps } from "@/services/ipc"
import { ServiceWorkerData } from "@/services/serviceWorkerData"
import { isSidePanelSupported } from "@/services/sidePanelSupport"
import type { CommandVariable } from "@/types"

type Sender = chrome.runtime.MessageSender

type execApiProps = {
  url: string
  pageUrl: string
  pageTitle: string
  selectionText: string
  fetchOptions: string
  variables: CommandVariable[]
}

export const openPopup = (
  param: OpenPopupProps,
  _: Sender,
  response: (res: boolean) => void,
): boolean => {
  incrementCommandExecutionCount().then(async () => {
    try {
      await openPopupWindow(param)
      response(true)
    } catch (error) {
      console.error("Failed to execute openPopupWindow:", error)
      response(false)
    }
  })
  return true
}

export const openPopups = (
  param: OpenPopupsProps,
  _: Sender,
  response: (res: boolean) => void,
): boolean => {
  incrementCommandExecutionCount().then(async () => {
    try {
      await openPopupWindowMultiple(param)
      response(true)
    } catch (error) {
      console.error("Failed to execute openPopupWindowMultiple:", error)
      response(false)
    }
  })
  return true
}

export const openPopupAndClick = (
  param: OpenPopupAndClickProps,
  _: Sender,
  response: (res: unknown) => void,
): boolean => {
  incrementCommandExecutionCount().then(async () => {
    try {
      const { tabId } = await openPopupWindow(param)
      if (!tabId) {
        console.error("Tab ID is not available after opening popup")
        response(false)
        return
      }
      await Ipc.sendQueue(tabId, TabCommand.clickElement, {
        selector: (param as { selector: string }).selector,
      })
      response(true)
    } catch (error) {
      console.error("Failed to execute openPopupAndClick:", error)
      response(false)
    }
  })
  return true
}

export const openTab = (
  param: OpenTabProps,
  _: Sender,
  response: (res: unknown) => void,
): boolean => {
  openTabWithClipboard(param).then(({ tabId }) => {
    incrementCommandExecutionCount(tabId).then(() => {
      response(true)
    })
  })
  return true
}

export const openSidePanel = (
  param: OpenSidePanelProps,
  sender: Sender,
  response: (res: unknown) => void,
): boolean => {
  if (!isSidePanelSupported()) {
    console.debug("Side panel is not supported in this browser")
    response(false)
    return false
  }

  const open = (tabId: number) => {
    _openSidePanel({
      ...param,
      tabId,
    })
      .then(() => {
        incrementCommandExecutionCount(tabId)
      })
      .then(() => {
        // Register the tab ID for tracking
        const newEntry = { tabId, isLinkCommand: param.isLinkCommand ?? false }
        return ServiceWorkerData.update((data) => ({
          sidePanelTabs: data.sidePanelTabs.some((t) => t.tabId === tabId)
            ? data.sidePanelTabs.map((t) => (t.tabId === tabId ? newEntry : t))
            : [...data.sidePanelTabs, newEntry],
        }))
      })
      .then(() => {
        registerSidePanelTab(tabId, toUrl(param.url))
      })
      .then(() => {
        response(true)
      })
      .catch((error) => {
        console.error("Error during side panel operations:", error)
        response(false)
      })
  }

  // Since it needs to be tied to a user action, avoid asynchronous processing
  // and open the side panel immediately whenever a tab ID is available.
  const tabId = sender.tab?.id ?? ServiceWorkerData.get().activeTabId
  if (tabId != null) {
    open(tabId)
    return true
  }

  // activeTabId may still be the empty default right after the service worker
  // restarts. Wait for the persisted state and retry. This path is
  // asynchronous and may lose the user gesture, but it is only taken when no
  // tab ID is available synchronously, which would fail anyway.
  ServiceWorkerData.ready()
    .then(() => {
      const activeTabId = ServiceWorkerData.get().activeTabId
      if (activeTabId == null) {
        console.warn("No active tab ID available for opening side panel")
        response(false)
        return
      }
      open(activeTabId)
    })
    .catch((error) => {
      console.error("Failed to load service worker data:", error)
      response(false)
    })
  return true
}

export const closeSidePanel = (
  _: unknown,
  sender: Sender,
  response: (res: unknown) => void,
) => {
  const tabId = sender.tab?.id
  if (tabId == null) {
    return false
  }
  enhancedSettings
    .get()
    .then(async (settings) => {
      // Make sure sidePanelTabs is loaded, not the empty default.
      await ServiceWorkerData.ready()
      const serviceWorkerData = ServiceWorkerData.get()
      const tab = serviceWorkerData.sidePanelTabs.find((t) => t.tabId === tabId)
      if (tab) {
        const autoHideEnabled = tab.isLinkCommand
          ? settings.linkCommand.sidePanelAutoHide
          : settings.windowOption.sidePanelAutoHide
        if (autoHideEnabled) {
          await _closeSidePanel(tabId)
        }
      }
      response(true)
    })
    .catch((err) => {
      console.warn("Failed to handle panel click:", err)
      response(false)
    })

  return true
}

/**
 * Handle side panel closed event for a tab
 * @param {number} tabId - The ID of the tab whose side panel was closed
 * @return {Promise<void>} A promise that resolves when the side panel closed event is handled
 * This function is called when a side panel is closed, either by user action or programmatically.
 */
export const sidePanelClosed = async (tabId?: number): Promise<void> => {
  if (tabId == null) return
  try {
    await ServiceWorkerData.update((data) => {
      const { [tabId]: _, ...rest } = data.sidePanelUrls
      return {
        sidePanelTabs: data.sidePanelTabs.filter((t) => t.tabId !== tabId),
        sidePanelUrls: rest,
      }
    })
  } catch (e) {
    console.warn("Failed to cleanup side panel:", e)
  }
}

export const navigateSidePanel = (
  param: NavigateSidePanelProps,
  _sender: Sender,
): boolean => {
  const { url, tabId } = param

  if (!isSidePanelSupported()) {
    console.debug("[navigateSidePanel] Side panel is not supported")
    return false
  }

  // URL validation
  try {
    const urlObj = new URL(url)
    if (urlObj.protocol === "javascript:" || urlObj.protocol === "data:") {
      console.warn("[navigateSidePanel] Invalid protocol:", urlObj.protocol)
      return false
    }
  } catch (e) {
    console.error("[navigateSidePanel] Invalid URL:", url, e)
    return false
  }

  // Tab ID validation
  if (tabId == null) {
    console.warn("[navigateSidePanel] No tab ID")
    return false
  }

  // Fire-and-forget: update URL without blocking the message handler
  ServiceWorkerData.ready()
    .then(() => {
      // Check if tab is in sidePanelTabs (after the persisted state is loaded)
      const serviceWorkerData = ServiceWorkerData.get()
      if (!serviceWorkerData.sidePanelTabs.some((t) => t.tabId === tabId)) {
        console.warn("[navigateSidePanel] Tab is not in sidePanelTabs:", tabId)
        return
      }
      return _updateSidePanelUrl({ url, tabId }).then(() => {
        // Update ServiceWorkerData's sidePanelUrls
        return ServiceWorkerData.update((data) => ({
          sidePanelUrls: {
            ...data.sidePanelUrls,
            [tabId]: url,
          },
        }))
      })
    })
    .catch((error) => {
      console.error("[navigateSidePanel] Error:", error)
    })

  return false
}

function bindVariables(
  str: string,
  variables: CommandVariable[],
  obj: { [key: string]: string },
): string {
  const arr = [...variables]
  for (const [key, value] of Object.entries(obj)) {
    arr.push({ name: key, value: value })
  }
  let res = str
  for (const v of arr) {
    const re = new RegExp(`\\$\\{${v.name}\\}`, "g")
    res = res.replace(re, v.value)
  }
  return res
}

export const execApi = (
  param: execApiProps,
  _: Sender,
  response: (res: unknown) => void,
): boolean => {
  const { url, pageUrl, pageTitle, selectionText, fetchOptions, variables } =
    param
  try {
    const str = bindVariables(fetchOptions, variables, {
      pageUrl,
      pageTitle,
      text: escapeJson(escapeJson(selectionText)),
    })
    const opt = JSON.parse(str)
    const exec = async () => {
      const res = await fetch(url, opt)
      const json = await res.json()
      response({ ok: res.ok, res: json })
    }
    exec()
  } catch (e) {
    console.error(e)
    response({ ok: false, res: e })
  }
  // return async
  return true
}
