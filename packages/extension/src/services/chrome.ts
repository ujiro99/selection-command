import { sleep, toUrl, isOverBytes, isUrlParam } from "@/lib/utils"
import type { ScreenSize } from "@/services/dom"
import type { ShowToastParam, UrlParam, WindowLayer } from "@/types"
import { POPUP_OFFSET, POPUP_TYPE, WINDOW_STATE } from "@/const"
import { BgData } from "@/services/backgroundData"
import { WindowStackManager } from "@/services/windowStackManager"
import { BgCommand, ClipboardResult, TabCommand } from "@/services/ipc"
import { Ipc } from "@/services/ipc"
import { t } from "@/services/i18n"

BgData.init()

/**
 * Check if a window exists
 * @param {number} windowId - The ID of the window to check
 * @returns {Promise<boolean>} True if the window exists, false otherwise
 */
export const windowExists = async (windowId: number): Promise<boolean> => {
  try {
    await chrome.windows.get(windowId)
    return true
  } catch {
    return false
  }
}

const failsafe = (url: string, favicon: string) => {
  if (isOverBytes(favicon, 1000)) {
    console.warn("favicon failsafe", url)
    return `https://www.google.com/s2/favicons?sz=64&domain_url=${url}`
  }
  return favicon
}

/**
 * Get favicon url from url.
 *
 * @param {string} url
 * @returns {Promise<string>} favicon url
 */
export const fetchIconUrl = async (url: string): Promise<string> => {
  const p = new Promise<string>((resolve, reject) => {
    const timeoutId = setTimeout(async () => {
      if (w?.id) {
        await closeWindow(w.id, "fetchIconUrl timeout")
      }
      chrome.tabs.onUpdated.removeListener(onUpdated)
      console.warn("timeout", url)
      reject("timeout")
    }, 5000)

    const onUpdated = async (
      tabId: number,
      changeInfo: chrome.tabs.OnUpdatedInfo,
      tab: chrome.tabs.Tab,
    ) => {
      if (w == null) {
        // illigal state
        chrome.tabs.onUpdated.removeListener(onUpdated)
        return
      }
      if (tabId === w.tabs?.[0].id && changeInfo.status === "complete") {
        clearTimeout(timeoutId)
        chrome.tabs.onUpdated.removeListener(onUpdated)
        if (tab.favIconUrl) {
          resolve(failsafe(url, tab.favIconUrl))
        } else {
          // retry
          await sleep(100)
          const t = await chrome.tabs.get(tabId)
          if (t.favIconUrl) {
            resolve(failsafe(url, t.favIconUrl))
          } else {
            // failed...
            console.warn(tab)
            reject()
          }
        }
        if (w?.id) {
          await closeWindow(w.id, "fetchIconUrl close window")
        }
      }
    }
    chrome.tabs.onUpdated.addListener(onUpdated)
  })
  const w = await chrome.windows.create({
    url: toUrl({
      searchUrl: url,
      selectionText: "test",
      useClipboard: false,
    }),
    state: "minimized",
  })
  return p
}

export type OpenPopupProps = {
  commandId: string
  url: string | UrlParam
  top: number
  left: number
  width: number
  height: number
  screen: ScreenSize
  type: POPUP_TYPE
  windowState?: WINDOW_STATE
}

export type OpenPopupsProps = {
  commandId: string
  urls: string[]
  top: number
  left: number
  width: number
  height: number
  screen: ScreenSize
  type: POPUP_TYPE
}

export type OpenTabProps = {
  url: string | UrlParam
  active: boolean
}

type ReadClipboardParam = Omit<OpenPopupsProps, "urls"> & {
  incognito: boolean
  state?: "fullscreen" | "maximized"
}

type ReadClipboardResult = {
  clipboardText: string
  window: chrome.windows.Window
  err?: string
}

type OpenResult = {
  tabId: number | undefined
  clipboardText: string
}

/**
 * Adjust window position to fit within screen bounds
 * @param {number} top - Initial top position
 * @param {number} left - Initial left position
 * @param {number} width - Window width
 * @param {number} height - Window height
 * @param {ScreenSize} screen - Screen size information
 * @param {number} [offset=0] - Offset multiplier for multiple windows
 * @returns {{ top: number; left: number }} Adjusted position
 */
const adjustWindowPosition = (
  top: number,
  left: number,
  width: number,
  height: number,
  screen: ScreenSize,
  offset: number = 0,
): { top: number; left: number } => {
  let t = top + POPUP_OFFSET * offset
  let l = left + POPUP_OFFSET * offset

  if (screen.height < t + height - screen.top) {
    t =
      Math.floor((screen.height - height) / 2) +
      screen.top +
      POPUP_OFFSET * offset
  }
  if (screen.width < l + width - screen.left) {
    l =
      Math.floor((screen.width - width) / 2) +
      screen.left +
      POPUP_OFFSET * offset
  }

  return { top: t, left: l }
}

/**
 * Update background data with window information
 * @param {chrome.windows.Window[]} windows - Array of windows to update
 * @param {string} commandId - Command ID
 * @param {number | undefined} currentWindowId - Current window ID
 * @param {POPUP_TYPE} type - Popup type
 */
const updateBackgroundData = async (
  windows: chrome.windows.Window[],
  commandId: string,
  currentWindowId: number | undefined,
  type: POPUP_TYPE,
) => {
  if (windows?.length > 0) {
    if (type === POPUP_TYPE.POPUP) {
      // Use WindowStackManager for popup windows with batch operation
      const windowsToAdd = windows
        .filter((window) => window.id && currentWindowId !== undefined)
        .map((window) => ({
          window: {
            id: window.id!,
            commandId,
            srcWindowId: currentWindowId!,
          },
          parentWindowId: currentWindowId!,
        }))

      if (windowsToAdd.length > 0) {
        await WindowStackManager.addWindows(windowsToAdd)
      }
    } else {
      // Keep existing logic for normal windows
      const layer = windows.map((w) => ({
        id: w.id,
        commandId,
        srcWindowId: currentWindowId,
      })) as WindowLayer

      await BgData.update(() => ({
        normalWindows: layer,
      }))
    }
  }
}

/**
 * Update network request rules for specified tabs
 * @param {number[]} tabIds - Array of tab IDs to update rules for
 */
const updateRules = async (tabIds: number[]) => {
  const oldRules = await chrome.declarativeNetRequest.getSessionRules()
  const oldRuleIds = oldRules.map((rule) => rule.id)
  chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: oldRuleIds,
    addRules: [
      {
        id: 1,
        priority: 1,
        action: {
          type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
          responseHeaders: [
            {
              header: "Content-Disposition",
              operation: chrome.declarativeNetRequest.HeaderOperation.REMOVE,
            },
            {
              header: "Content-Type",
              operation: chrome.declarativeNetRequest.HeaderOperation.SET,
              value: "image/jpeg",
            },
          ],
        },
        condition: {
          tabIds,
          resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
          responseHeaders: [
            {
              header: "content-disposition",
              values: ["attachment*jpg*"],
            },
            {
              header: "content-disposition",
              values: ["attachment*jpeg*"],
            },
          ],
        },
      },
      {
        id: 2,
        priority: 2,
        action: {
          type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
          responseHeaders: [
            {
              header: "Content-Disposition",
              operation: chrome.declarativeNetRequest.HeaderOperation.REMOVE,
            },
            {
              header: "Content-Type",
              operation: chrome.declarativeNetRequest.HeaderOperation.SET,
              value: "image/png",
            },
          ],
        },
        condition: {
          tabIds,
          resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
          responseHeaders: [
            {
              header: "content-disposition",
              values: ["attachment*png*"],
            },
          ],
        },
      },
      {
        id: 3,
        priority: 3,
        action: {
          type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
          responseHeaders: [
            {
              header: "Content-Disposition",
              operation: chrome.declarativeNetRequest.HeaderOperation.REMOVE,
            },
            {
              header: "Content-Type",
              operation: chrome.declarativeNetRequest.HeaderOperation.SET,
              value: "application/pdf",
            },
          ],
        },
        condition: {
          tabIds,
          resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
          responseHeaders: [
            {
              header: "content-disposition",
              values: ["attachment*pdf*"],
            },
          ],
        },
      },
    ],
  })
}

/**
 * Read clipboard content from a tab
 * @param {number} tabId - The ID of the tab to read clipboard from
 * @returns {Promise<ClipboardResult>} The clipboard content
 */
const readClipboardContent = async (
  tabId: number,
): Promise<ClipboardResult> => {
  try {
    const result = await new Promise<ClipboardResult>((resolve) => {
      chrome.runtime.onConnect.addListener(function(port) {
        if (port.sender?.tab?.id !== tabId) {
          return
        }
        port.onMessage.addListener(function(msg) {
          if (msg.command === BgCommand.setClipboard) {
            resolve(msg.data)
          }
        })
      })
      if (chrome.runtime.lastError) {
        throw new Error(chrome.runtime.lastError.message)
      }
    })

    return result
  } catch (e) {
    console.error(e)
    return { data: "", err: e instanceof Error ? e.message : "Unknown error" }
  }
}

const openWindowAndReadClipboard = async (
  param: ReadClipboardParam,
): Promise<ReadClipboardResult> => {
  const usesWindowState =
    param.state === "fullscreen" || param.state === "maximized"
  const w = await chrome.windows.create({
    url: chrome.runtime.getURL("src/clipboard.html"),
    focused: true,
    type: param.type,
    width: usesWindowState ? undefined : param.width,
    height: usesWindowState ? undefined : param.height,
    left: usesWindowState ? undefined : param.left,
    top: usesWindowState ? undefined : param.top,
    state: param.state,
    incognito: param.incognito,
  })

  const result = await readClipboardContent(w!.tabs![0].id as number)

  return {
    window: w!,
    clipboardText: result.data ?? "",
    err: result.err,
  }
}

export const openPopupWindow = async (
  param: OpenPopupProps,
): Promise<OpenResult> => {
  const { top, left, width, height, screen, url } = param
  let current: chrome.windows.Window

  try {
    current = await chrome.windows.getCurrent()
  } catch (e) {
    current = { id: undefined, incognito: false } as chrome.windows.Window
  }

  const type = param.type ?? POPUP_TYPE.POPUP
  const isFullscreen = param.windowState === WINDOW_STATE.FULLSCREEN
  const isMaximized = param.windowState === WINDOW_STATE.MAXIMIZED
  const { top: at, left: al } = adjustWindowPosition(
    top,
    left,
    width,
    height,
    screen,
  )

  const usesWindowState = isFullscreen || isMaximized
  const windowState = isFullscreen
    ? "fullscreen"
    : isMaximized
      ? "maximized"
      : undefined

  let window: chrome.windows.Window
  let clipboardText = ""

  if (isUrlParam(url) && url.useClipboard) {
    const result = await openWindowAndReadClipboard({
      commandId: param.commandId,
      screen: param.screen,
      type,
      width,
      height,
      top: at,
      left: al,
      state: windowState,
      incognito: current.incognito,
    })
    window = result.window
    clipboardText = result.clipboardText

    try {
      await chrome.tabs.update(window.tabs?.[0].id as number, {
        url: toUrl(url, clipboardText),
      })
      if (isFullscreen) {
        // On macOS, even if you open with state: "fullscreen",
        // it may not actually go fullscreen, so switch to fullscreen after opening.
        await chrome.windows.update(window.id!, { state: "fullscreen" })
      }
    } catch (e) {
      console.error(e)
    }

    if (result.err) {
      await Ipc.ensureConnection(window.tabs?.[0].id as number)
      await Ipc.sendTab<ShowToastParam>(
        window.tabs?.[0].id as number,
        TabCommand.showToast,
        {
          title: t("clipboard_error_title"),
          description: t("clipboard_error_description"),
          action: t("clipboard_error_action"),
        },
      )
    }
  } else {
    window = (await chrome.windows.create({
      url: toUrl(url),
      type,
      width: usesWindowState ? undefined : width,
      height: usesWindowState ? undefined : height,
      top: usesWindowState ? undefined : at,
      left: usesWindowState ? undefined : al,
      state: windowState,
      incognito: current.incognito,
    }))!
    try {
      if (isFullscreen) {
        // On macOS, even if you open with state: "fullscreen",
        // it may not actually go fullscreen, so switch to fullscreen after opening.
        await chrome.windows.update(window.id!, { state: "fullscreen" })
      }
    } catch (e) {
      console.error(e)
    }
  }

  await updateBackgroundData([window], param.commandId, current.id, type)
  if (window.tabs?.[0]?.id) {
    updateRules([window.tabs[0].id])
  }

  return {
    tabId: window.tabs?.[0]?.id,
    clipboardText,
  }
}

export const openPopupWindowMultiple = async (
  param: OpenPopupsProps,
): Promise<number[]> => {
  const { top, left, width, height, screen } = param
  let current: chrome.windows.Window
  try {
    current = await chrome.windows.getCurrent()
  } catch (e) {
    current = { id: undefined, incognito: false } as chrome.windows.Window
  }

  const type = param.type ?? POPUP_TYPE.POPUP
  const windows = await Promise.all(
    param.urls
      .reverse()
      .map((url, idx) => {
        const { top: t, left: l } = adjustWindowPosition(
          top,
          left,
          width,
          height,
          screen,
          idx,
        )
        return chrome.windows.create({
          url,
          width,
          height,
          top: t,
          left: l,
          type,
          incognito: current.incognito,
        })
      })
      .filter((p): p is Promise<chrome.windows.Window> => p !== null),
  )

  await updateBackgroundData(windows, param.commandId, current.id, type)

  const tabIds = windows.reduce((tabIds, w) => {
    w.tabs?.forEach((t) => t.id && tabIds.push(t.id))
    return tabIds
  }, [] as number[])
  updateRules(tabIds)

  return tabIds
}

export const openTab = async (param: OpenTabProps): Promise<OpenResult> => {
  const { url, active } = param

  let currentTab: chrome.tabs.Tab | null = null
  try {
    currentTab = await getCurrentTab()
  } catch (e) {
    console.warn("Failed to get current tab:", e)
  }

  let useClipboard = false
  if (isUrlParam(url)) {
    useClipboard = url.useClipboard ?? false
  }

  if (useClipboard) {
    const tab = await chrome.tabs.create({
      url: chrome.runtime.getURL("src/clipboard.html"),
      active: true,
      windowId: currentTab?.windowId,
      index: currentTab?.index !== undefined ? currentTab.index + 1 : undefined,
    })

    const result = await readClipboardContent(tab.id as number)
    await chrome.tabs.update(tab.id as number, { url: toUrl(url) })

    if (result.err) {
      await Ipc.ensureConnection(tab.id as number)
      await Ipc.sendTab<ShowToastParam>(
        tab.id as number,
        TabCommand.showToast,
        {
          title: t("clipboard_error_title"),
          description: t("clipboard_error_description"),
          action: t("clipboard_error_action"),
        },
      )
    }

    return {
      tabId: tab.id as number,
      clipboardText: result.data ?? "",
    }
  } else {
    const tab = await chrome.tabs.create({
      url: toUrl(url),
      active,
      windowId: currentTab?.windowId,
      index: currentTab?.index !== undefined ? currentTab.index + 1 : undefined,
    })
    return {
      tabId: tab.id as number,
      clipboardText: "",
    }
  }
}

/**
 * Get the current tab.
 * @returns {Promise<chrome.tabs.Tab>}
 */
export async function getCurrentTab(): Promise<chrome.tabs.Tab> {
  const queryOptions = { active: true, lastFocusedWindow: true }
  const [tab] = await chrome.tabs.query(queryOptions)
  return tab
}

/**
 * Close a window.
 * @param windowId - The ID of the window to close.
 * @param log - The log message to print.
 * @returns A promise that resolves when the window is closed.
 */
export async function closeWindow(
  windowId: number,
  log?: string,
): Promise<void> {
  try {
    await chrome.windows.remove(windowId)
  } catch (e) {
    console.warn(log, e)
  }
}

export type OpenSidePanelProps = {
  url: string | UrlParam
  tabId?: number
  isLinkCommand?: boolean
}

export type UpdateSidePanelUrlProps = {
  url: string
  tabId: number
}

/**
 * Open a side panel with the specified URL (background script context only)
 * @param {OpenSidePanelProps} param - Parameters for opening the side panel
 * @returns {Promise<OpenResult>} Result containing tab ID and clipboard text
 */
export const openSidePanel = async (
  param: OpenSidePanelProps,
): Promise<{ tabId: number | undefined }> => {
  const { url, tabId } = param

  const targetTabId = tabId
  if (!targetTabId) {
    console.error("No valid tab ID for side panel")
    return {
      tabId: undefined,
    }
  }

  // Set the side panel options for the tab
  // Do not await here because sidePanel.open() must be executed within a user gesture.
  chrome.sidePanel.setOptions({
    tabId: targetTabId,
    path: toUrl(url),
    enabled: true,
  })

  // Open the side panel
  await chrome.sidePanel.open({ tabId: targetTabId })

  return {
    tabId: targetTabId,
  }
}

/**
 * Close the side panel for the specified tab
 * @param {number} tabId - The ID of the tab to close the side panel for
 * @returns {Promise<void>} A promise that resolves when the side panel is closed
 */
export const closeSidePanel = async (tabId: number): Promise<void> => {
  try {
    await chrome.sidePanel.close({ tabId: tabId })
  } catch (e) {
    console.warn("Failed to close side panel:", e)
  }
}

/**
 * Update the side panel URL for the specified tab
 * @param {UpdateSidePanelUrlProps} param - Parameters containing URL and tab ID
 * @returns {Promise<void>} A promise that resolves when the URL is updated
 */
export const updateSidePanelUrl = async (
  param: UpdateSidePanelUrlProps,
): Promise<void> => {
  const { url, tabId } = param

  try {
    // Update the side panel URL
    await chrome.sidePanel.setOptions({
      tabId: tabId,
      path: url,
      enabled: true,
    })
    // console.debug("[updateSidePanelUrl] Updated:", { tabId, url })
  } catch (error) {
    console.error("[updateSidePanelUrl] Failed:", error)
    throw error
  }
}
