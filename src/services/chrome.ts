import { sleep, toUrl, isOverBytes, isUrlParam } from '@/lib/utils'
import type { ScreenSize } from '@/services/dom'
import type { UrlParam, WindowLayer } from '@/types'
import { POPUP_OFFSET, POPUP_TYPE } from '@/const'
import { BgData } from '@/services/backgroundData'
import { BgCommand, ClipboardResult } from '@/services/ipc'

BgData.init()

const failsafe = (url: string, favicon: string) => {
  if (isOverBytes(favicon, 1000)) {
    console.warn('favicon failsafe', url)
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
  let w: chrome.windows.Window

  const p = new Promise<string>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      chrome.windows.remove(w.id as number)
      chrome.tabs.onUpdated.removeListener(onUpdated)
      console.warn('timeout', url)
      reject('timeout')
    }, 5000)

    const onUpdated = async (
      tabId: number,
      changeInfo: chrome.tabs.TabChangeInfo,
      tab: chrome.tabs.Tab,
    ) => {
      if (w == null) {
        // illigal state
        chrome.tabs.onUpdated.removeListener(onUpdated)
        return
      }
      if (tabId === w.tabs?.[0].id && changeInfo.status === 'complete') {
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
        chrome.windows.remove(w.id as number)
      }
    }
    chrome.tabs.onUpdated.addListener(onUpdated)
  })
  w = await chrome.windows.create({
    url: toUrl({
      searchUrl: url,
      selectionText: 'test',
      useClipboard: false,
    }),
    state: 'minimized',
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

type ReadClipboardParam = Omit<OpenPopupsProps, 'urls'> & {
  incognito: boolean
}

type ReadClipboardResult = {
  clipboardText: string
  window: chrome.windows.Window
}

/**
 * Opens a window to read the clipboard content
 * @param {ReadClipboardParam } param - The parameters for the popup window
 * @returns {Promise<ReadClipboardResult>} The clipboard content
 */
export const openWindowAndReadClipboard = async (
  param: ReadClipboardParam,
): Promise<ReadClipboardResult> => {
  const w = await chrome.windows.create({
    url: chrome.runtime.getURL('src/clipboard.html'),
    focused: true,
    type: param.type,
    width: param.width,
    height: param.height,
    left: param.left,
    top: param.top,
    incognito: param.incognito,
  })

  let result = ''
  try {
    const tabId = w.tabs?.[0].id as number
    const { data, err } = await new Promise<ClipboardResult>((resolve) => {
      chrome.runtime.onConnect.addListener(function (port) {
        if (port.sender?.tab?.id !== tabId) {
          return
        }
        port.onMessage.addListener(function (msg) {
          if (msg.command === BgCommand.setClipboard) {
            resolve(msg.data)
          }
        })
      })
      if (chrome.runtime.lastError) {
        throw new Error(chrome.runtime.lastError.message)
      }
    })

    if (err != null) {
      throw new Error(`Failed to read clipboard: ${err}`)
    }

    result = data ?? ''
  } catch (e) {
    console.error(e)
  }

  return {
    clipboardText: result,
    window: w,
  }
}

type OpenResult = {
  tabId: number
  clipboardText: string
}

export const openPopupWindow = async (
  param: OpenPopupProps,
): Promise<OpenResult> => {
  const { top, left, width, height, screen, url } = param
  let current: chrome.windows.Window

  try {
    current = await chrome.windows.getCurrent()
  } catch (e) {
    // console.warn('Failed to get current window:', e)
    current = { id: undefined, incognito: false } as chrome.windows.Window
  }

  const type = param.type ?? POPUP_TYPE.POPUP
  let t = top + POPUP_OFFSET
  let l = left + POPUP_OFFSET

  // If the window extends beyond the screen size,
  // return the display position to the center.
  if (screen.height < t + height - screen.top) {
    t = Math.floor((screen.height - height) / 2) + screen.top + POPUP_OFFSET
  }
  if (screen.width < l + width - screen.left) {
    l = Math.floor((screen.width - width) / 2) + screen.left + POPUP_OFFSET
  }
  const { clipboardText, window } = await openWindowAndReadClipboard({
    commandId: param.commandId,
    screen: param.screen,
    type,
    width,
    height,
    top: t,
    left: l,
    incognito: current.incognito,
  })

  chrome.tabs.update(window.tabs?.[0].id as number, {
    url: toUrl(url, clipboardText),
  })
  if (chrome.runtime.lastError) {
    console.error(chrome.runtime.lastError)
  }

  const layer = [
    {
      id: window.id,
      commandId: param.commandId,
      srcWindowId: current.id,
    },
  ] as WindowLayer
  if (type === POPUP_TYPE.POPUP) {
    await BgData.set((data) => ({
      ...data,
      windowStack: [...data.windowStack, layer],
    }))
  } else {
    await BgData.set((data) => ({
      ...data,
      normalWindows: layer,
    }))
  }

  updateRules([window.tabs?.[0].id as number])

  return {
    tabId: window.tabs?.[0].id as number,
    clipboardText: clipboardText,
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
    // console.warn('Failed to get current window:', e)
    current = { id: undefined, incognito: false } as chrome.windows.Window
  }
  const type = param.type ?? POPUP_TYPE.POPUP
  const windows = await Promise.all(
    param.urls.reverse().map((url, idx) => {
      let t = top + POPUP_OFFSET * idx
      let l = left + POPUP_OFFSET * idx

      // If the window extends beyond the screen size,
      // return the display position to the center.
      if (screen.height < t + height - screen.top) {
        t =
          Math.floor((screen.height - height) / 2) +
          screen.top +
          POPUP_OFFSET * idx
      }
      if (screen.width < l + width - screen.left) {
        l =
          Math.floor((screen.width - width) / 2) +
          screen.left +
          POPUP_OFFSET * idx
      }
      return chrome.windows.create({
        url,
        width,
        height,
        top: t,
        left: l,
        type,
        incognito: current.incognito,
      })
    }),
  )
  if (windows?.length > 0) {
    const layer = windows.map((w) => ({
      id: w.id,
      commandId: param.commandId,
      srcWindowId: current.id,
    })) as WindowLayer
    if (type === POPUP_TYPE.POPUP) {
      await BgData.set((data) => ({
        ...data,
        windowStack: [...data.windowStack, layer],
      }))
    } else {
      await BgData.set((data) => ({
        ...data,
        normalWindows: layer,
      }))
    }
  }

  const tabIds = windows.reduce((tabIds, w) => {
    w.tabs?.forEach((t) => t.id && tabIds.push(t.id))
    return tabIds
  }, [] as number[])
  updateRules(tabIds)

  return tabIds
}

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
              header: 'Content-Disposition',
              operation: chrome.declarativeNetRequest.HeaderOperation.REMOVE,
            },
            {
              header: 'Content-Type',
              operation: chrome.declarativeNetRequest.HeaderOperation.SET,
              value: 'image/jpeg',
            },
          ],
        },
        condition: {
          tabIds,
          resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
          responseHeaders: [
            {
              header: 'content-disposition',
              values: ['attachment*jpg*'],
            },
            {
              header: 'content-disposition',
              values: ['attachment*jpeg*'],
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
              header: 'Content-Disposition',
              operation: chrome.declarativeNetRequest.HeaderOperation.REMOVE,
            },
            {
              header: 'Content-Type',
              operation: chrome.declarativeNetRequest.HeaderOperation.SET,
              value: 'image/png',
            },
          ],
        },
        condition: {
          tabIds,
          resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
          responseHeaders: [
            {
              header: 'content-disposition',
              values: ['attachment*png*'],
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
              header: 'Content-Disposition',
              operation: chrome.declarativeNetRequest.HeaderOperation.REMOVE,
            },
            {
              header: 'Content-Type',
              operation: chrome.declarativeNetRequest.HeaderOperation.SET,
              value: 'application/pdf',
            },
          ],
        },
        condition: {
          tabIds,
          resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
          responseHeaders: [
            {
              header: 'content-disposition',
              values: ['attachment*pdf*'],
            },
          ],
        },
      },
    ],
  })
}

export const openTab = async (param: OpenTabProps): Promise<OpenResult> => {
  const { url, active } = param

  let currentTab: chrome.tabs.Tab | null = null
  try {
    currentTab = await getCurrentTab()
  } catch (e) {
    console.warn('Failed to get current tab:', e)
  }

  let useClipboard = false
  if (isUrlParam(url)) {
    useClipboard = url.useClipboard ?? false
  }

  if (useClipboard) {
    const tab = await chrome.tabs.create({
      url: chrome.runtime.getURL('src/clipboard.html'),
      active: true,
      windowId: currentTab?.windowId,
      index: currentTab?.index !== undefined ? currentTab.index + 1 : undefined,
    })

    let clipboardText = ''
    try {
      const { data, err } = await new Promise<ClipboardResult>((resolve) => {
        chrome.runtime.onConnect.addListener(function (port) {
          if (port.sender?.tab?.id !== tab.id) {
            return
          }
          port.onMessage.addListener(function (msg) {
            if (msg.command === BgCommand.setClipboard) {
              resolve(msg.data)
            }
          })
        })
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message)
        }
      })

      if (err != null) {
        throw new Error(`Failed to read clipboard: ${err}`)
      }
      clipboardText = data ?? ''
    } catch (e) {
      console.error(e)
    }

    chrome.tabs.update(tab.id as number, { url: toUrl(url) })
    return {
      tabId: tab.id as number,
      clipboardText: clipboardText,
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
      clipboardText: '',
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
