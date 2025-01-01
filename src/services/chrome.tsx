import { sleep, toUrl } from '@/lib/utils'

/**
 * Get favicon url from url.
 *
 * @param {string} url
 * @returns {Promise<string>} favicon url
 */
export const fetchIconUrl = async (url: string): Promise<string> => {
  let w: chrome.windows.Window
  const timeoutId = setTimeout(() => {
    chrome.windows.remove(w.id as number)
    console.warn('timeout', url)
    throw new Error('timeout')
  }, 5000)

  const p = new Promise<string>((resolve, reject) => {
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (tabId === w.tabs?.[0].id && changeInfo.status === 'complete') {
        clearTimeout(timeoutId)
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
    })
  })
  w = await chrome.windows.create({
    url: toUrl(url, 'test'),
    state: 'minimized',
  })
  return p
}
