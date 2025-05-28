import { sleep, toUrl, isOverBytes } from '@/lib/utils'
import type { ScreenSize } from '@/services/dom'
import type { WindowLayer } from '@/types'
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
    url: toUrl(url, 'test'),
    state: 'minimized',
  })
  return p
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

export const openPopupWindows = async (
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
        width: width,
        height: height,
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
 * Opens a window to read the clipboard content
 * @returns {Promise<string>} The clipboard content
 */
export const openClipboardReader = async (): Promise<string> => {
  const w = await chrome.windows.create({
    url: chrome.runtime.getURL('src/clipboard.html'),
    type: 'popup',
    width: 1,
    height: 1,
    left: 0,
    top: 0,
    focused: true,
  })

  await BgData.set((data) => ({
    ...data,
    clipboardWindowId: w.id ?? null,
  }))

  let result = ''
  try {
    const tabId = w.tabs?.[0].id as number
    const res = await new Promise<ClipboardResult>((resolve) => {
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
    })
    if (chrome.runtime.lastError) {
      throw new Error(chrome.runtime.lastError.message)
    }
    const { data, err } = await res

    if (err != null) {
      throw new Error(`Failed to read clipboard: ${err}`)
    }
    result = data ?? ''
  } catch (e) {
    console.error(e)
  }

  try {
    await chrome.windows.remove(w.id as number)
  } catch (e) {
    console.error(e)
  } finally {
    await BgData.set((data) => ({
      ...data,
      clipboardWindowId: null,
    }))
  }

  return result
}
