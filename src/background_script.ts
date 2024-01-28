import * as mv3 from 'mv3-hot-reload'
import { isDebug } from './const'
import { Ipc, IpcCommand, IpcCallback } from './services/ipc'
import { CommandVariable } from './services/userSettings'
import { escape } from './services/util'

mv3.utils.setConfig({ isDev: isDebug })
mv3.background.init()

type Sender = chrome.runtime.MessageSender

export type execApiProps = {
  url: string
  pageUrl: string
  pageTitle: string
  selectionText: string
  fetchOptions: string
  variables: CommandVariable[]
}

function bindVariables(
  str: string,
  variables: CommandVariable[],
  obj: {},
): string {
  let arr = [...variables]
  Object.entries(obj).forEach(([key, value]) => {
    arr.push({ name: key, value: value })
  })
  arr.forEach((v) => {
    const re = new RegExp(`\\$\\{${v.name}\\}`, 'g')
    str = str.replace(re, v.value)
  })
  return str
}

const commandFuncs = {
  [IpcCommand.openSidePanel]: (param: unknown, sender: Sender): boolean => {
    const tabId = sender?.tab?.id
    if (tabId != null) {
      openSidePanel(tabId).then(() => {
        return true
      })
    }
    return false
  },

  [IpcCommand.openPopup]: (param: unknown, sender: Sender): boolean => {
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

  [IpcCommand.openOption]: (param: unknown, sender: Sender): boolean => {
    chrome.tabs.create({
      url: 'options_page.html',
    })
    return false
  },

  [IpcCommand.execApi]: (
    param: execApiProps,
    sender: Sender,
    response: (res: unknown) => void,
  ): boolean => {
    const { url, pageUrl, pageTitle, selectionText, fetchOptions, variables } =
      param
    try {
      const str = bindVariables(fetchOptions, variables, {
        pageUrl,
        pageTitle,
        text: escape(escape(selectionText)),
      })
      const opt = JSON.parse(str)
      ;(async () => {
        const res = await fetch(url, opt)
        const json = await res.json()
        response({ ok: res.ok, res: json })
      })()
    } catch (e) {
      console.error(e)
      response({ ok: false, res: e })
    }
    // return async
    return true
  },
} as { [key: string]: IpcCallback }

Object.keys(IpcCommand).forEach((key) => {
  const command = IpcCommand[key as keyof typeof IpcCommand]
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
