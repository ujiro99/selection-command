import browser from 'webextension-polyfill'
import * as mv3 from 'mv3-hot-reload'

mv3.utils.setConfig({
  isDev: true,
})
mv3.background.init()

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.command == 'openSidePanel') {
    const tabId = sender?.tab?.id
    if (tabId != null) {
      openSidePanel(tabId).then(() => {
        sendResponse(true)
      })
    } else {
      sendResponse(false)
    }
  }
})

// top level await is available in ES modules loaded from script tags
const openSidePanel = async (tabId: number) => {
  await chrome.sidePanel.open({ tabId })
  await chrome.sidePanel.setOptions({
    tabId,
    path: 'sidepanel.html',
    enabled: true,
  })
}
