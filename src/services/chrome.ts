import { sleep, toUrl } from '@/lib/utils'

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
          resolve(tab.favIconUrl)
        } else {
          // retry
          await sleep(100)
          const t = await chrome.tabs.get(tabId)
          if (t.favIconUrl) {
            resolve(t.favIconUrl)
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
