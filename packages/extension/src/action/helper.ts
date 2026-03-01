import { escapeJson } from "@/lib/utils"
import {
  openPopupWindow,
  openPopupWindowMultiple,
  openTab as openTabWithClipboard,
  openSidePanel as _openSidePanel,
  closeSidePanel as _closeSidePanel,
  updateSidePanelUrl as _updateSidePanelUrl,
  OpenPopupsProps,
  OpenPopupProps,
  OpenTabProps,
  OpenSidePanelProps,
} from "@/services/chrome"
import { incrementCommandExecutionCount } from "@/services/commandMetrics"
import { enhancedSettings } from "@/services/settings/enhancedSettings"
import { Ipc, TabCommand, NavigateSidePanelProps } from "@/services/ipc"
import { BgData } from "@/services/backgroundData"
import type { CommandVariable } from "@/types"

type Sender = chrome.runtime.MessageSender

type OpenPopupAndClickProps = OpenPopupProps & {
  selector: string
}

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
      console.error("Failed to execute openPopups:", error)
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
      console.error("Failed to execute openPopups:", error)
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
  const tabId = sender.tab?.id

  // Since it needs to be tied to a user action, avoid asynchronous processing
  // and open the side panel immediately.
  _openSidePanel({
    ...param,
    tabId,
  })
    .then(() => {
      incrementCommandExecutionCount(tabId)
    })
    .then(() => {
      // Register the tab ID for tracking
      if (tabId) {
        // Update BgData to include the new side panel tab ID
        // If it's a link command, add to linkCommandSidePanelTabs; otherwise, add to sidePanelTabs.
        return BgData.update((data) => ({
          sidePanelTabs: !param.isLinkCommand
            ? data.sidePanelTabs.includes(tabId)
              ? data.sidePanelTabs
              : [...data.sidePanelTabs, tabId]
            : data.sidePanelTabs.filter((id) => id !== tabId),
          linkCommandSidePanelTabs: param.isLinkCommand
            ? data.linkCommandSidePanelTabs.includes(tabId)
              ? data.linkCommandSidePanelTabs
              : [...data.linkCommandSidePanelTabs, tabId]
            : data.linkCommandSidePanelTabs.filter((id) => id !== tabId),
        }))
      }
    })
    .then(() => {
      response(true)
    })
    .catch((error) => {
      console.error("Error during side panel operations:", error)
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
  enhancedSettings.get().then(async (settings) => {
    const sidePanelAutoHide = settings.windowOption.sidePanelAutoHide
    if (sidePanelAutoHide) {
      const bgData = BgData.get()
      if (bgData.sidePanelTabs.includes(tabId)) {
        await _closeSidePanel(tabId)
      }
    }
    const linkCommandSidePanelAutoHide = settings.linkCommand.sidePanelAutoHide
    if (linkCommandSidePanelAutoHide) {
      const bgData = BgData.get()
      if (bgData.linkCommandSidePanelTabs.includes(tabId)) {
        await _closeSidePanel(tabId)
      }
    }
    response(true)
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
  if (!tabId) return
  try {
    BgData.update((data) => {
      const { [tabId]: _, ...rest } = data.sidePanelUrls
      return {
        sidePanelTabs: data.sidePanelTabs.filter((id) => id !== tabId),
        linkCommandSidePanelTabs: data.linkCommandSidePanelTabs.filter(
          (id) => id !== tabId,
        ),
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

  // Check if tab is in sidePanelTabs
  const bgData = BgData.get()
  if (!bgData.sidePanelTabs.includes(tabId)) {
    console.warn("[navigateSidePanel] Tab is not in sidePanelTabs:", tabId)
    return false
  }

  // Fire-and-forget: update URL in the background
  _updateSidePanelUrl({ url, tabId })
    .then(() => {
      // Update BgData's sidePanelUrls
      return BgData.update((data) => ({
        sidePanelUrls: {
          ...data.sidePanelUrls,
          [tabId]: url,
        },
      }))
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
