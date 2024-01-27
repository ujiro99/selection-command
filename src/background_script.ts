import * as mv3 from 'mv3-hot-reload'
import { isDebug } from './const'
import { Ipc, Command, IpcCallback } from './services/ipc'

mv3.utils.setConfig({ isDev: isDebug })
mv3.background.init()

type Sender = chrome.runtime.MessageSender

const commandFuncs = {
  [Command.openSidePanel]: (param: unknown, sender: Sender): boolean => {
    const tabId = sender?.tab?.id
    if (tabId != null) {
      openSidePanel(tabId).then(() => {
        return true
      })
    }
    return false
  },

  [Command.openPopup]: (param: unknown, sender: Sender): boolean => {
    const open = async () => {
      const current = await chrome.windows.getCurrent()
      const window = await chrome.windows.create({
        url: param.url,
        width: 600,
        height: 700,
        top: param.top,
        left: param.left,
        type: 'popup',
        incognito: current.incognito,
      })
      lastWindowId = window.id
      // console.log('window create', lastWindowId)
    }
    open()
    return false
  },

  [Command.openOption]: (param: unknown, sender: Sender): boolean => {
    chrome.tabs.create({
      url: 'options_page.html',
    })
    return false
  },
} as { [key: string]: IpcCallback }

Object.keys(Command).forEach((key) => {
  const command = Command[key as keyof typeof Command]
  Ipc.addListener(command, commandFuncs[key])
})

let lastWindowId: number | undefined
let windowIdHistory = [] as number[]

chrome.windows.onFocusChanged.addListener((windowId: number) => {
  windowIdHistory.push(windowId)
  const beforeWindowId = windowIdHistory[windowIdHistory.length - 2]
  if (beforeWindowId != null && beforeWindowId == lastWindowId) {
    chrome.windows.remove(lastWindowId)
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

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({
    url: 'options_page.html',
  })
})
