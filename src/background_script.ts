import * as mv3 from 'mv3-hot-reload'
import { isDebug } from './const'
import { Ipc, BgCommand, SidePanelCommand, IpcCallback } from './services/ipc'
import { escape } from './services/util'
import { UserSettings, CommandVariable } from './services/userSettings'
import { Storage, STORAGE_KEY } from './services/storage'

mv3.utils.setConfig({ isDev: isDebug })
mv3.background.init()

type LastWindow = {
  id: number
  commandId: number
}

type BgVariables = {
  lastWindow: LastWindow | null
  windowIdHistory: number[]
  sidePanelTabId: number
  sidePanelOpened: boolean
}
type BgVarKey = keyof BgVariables

const bgVar = {
  get: async <T>(key: BgVarKey): Promise<T> => {
    const obj = await Storage.get<BgVariables>(STORAGE_KEY.BG)
    return obj[key] as T
  },
  set: async (key: BgVarKey, value: any) => {
    const obj = await Storage.get<BgVariables>(STORAGE_KEY.BG)
    return await Storage.set(STORAGE_KEY.BG, { ...obj, [key]: value })
  },
}

type Sender = chrome.runtime.MessageSender

export type openPopupProps = {
  commandId: number
  url: string
  top: number
  left: number
  width: number
  height: number
}

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
  [BgCommand.openPopup]: (param: openPopupProps): boolean => {
    const open = async () => {
      const current = await chrome.windows.getCurrent()
      const window = await chrome.windows.create({
        url: param.url,
        width: param.width,
        height: param.height,
        top: param.top,
        left: param.left,
        type: 'popup',
        incognito: current.incognito,
      })
      if (window.id) {
        bgVar.set('lastWindow', {
          id: window.id,
          commandId: param.commandId,
        })
      }
      // console.log('window create', lastWindowId)
    }
    open()
    return false
  },

  [BgCommand.enableSidePanel]: (param: unknown, sender: Sender): boolean => {
    const tabId = sender?.tab?.id
    if (tabId != null) {
      console.debug('enable sidePanel', tabId)
      bgVar.set('sidePanelTabId', tabId)
      chrome.sidePanel.setOptions({
        tabId,
        path: 'sidepanel.html',
        enabled: true,
      })
    }
    return false
  },

  [BgCommand.disableSidePanel]: (param: unknown, sender: Sender): boolean => {
    const tabId = sender?.tab?.id
    if (tabId != null) {
      console.debug('disable sidePanel', tabId)
      bgVar.set('sidePanelTabId', null)
      bgVar.set('sidePanelOpened', false)
      chrome.sidePanel.setOptions({
        tabId,
        enabled: false,
      })
    }
    return false
  },

  [BgCommand.openSidePanel]: (
    param: unknown,
    sender: Sender,
    response,
  ): boolean => {
    console.debug('open sidePanel', param)
    const tabId = sender?.tab?.id
    const { url } = param as { url: string }
    if (tabId != null) {
      openSidePanel(tabId, url).then((ret) => {
        console.debug('ret openSidePanel', ret)
        response && response(ret)
      })
    }
    return true
  },

  [BgCommand.openOption]: (param: unknown, sender: Sender): boolean => {
    chrome.tabs.create({
      url: 'options_page.html',
    })
    return false
  },

  [BgCommand.execApi]: (
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

Object.keys(BgCommand).forEach((key) => {
  const command = BgCommand[key as keyof typeof BgCommand]
  Ipc.addListener(command, commandFuncs[key])
})

const openSidePanel = async (tabId: number, url: string) => {
  await chrome.sidePanel.open({ tabId })
  await updateRules(tabId)
  const sidePanelOpened = await bgVar.get('sidePanelOpened')
  return new Promise((resolve) => {
    if (sidePanelOpened) {
      Ipc.send(SidePanelCommand.setUrl, { url }).then((ret) => {
        resolve(ret)
      })
    } else {
      Ipc.addListener(SidePanelCommand.onLoad, () => {
        Ipc.send(SidePanelCommand.setUrl, { url }).then((ret) => {
          resolve(ret)
        })
        bgVar.set('sidePanelOpened', true)
        return true
      })
    }
  })
}

const updateRules = async (tabId: number) => {
  let rules = await chrome.declarativeNetRequest.getSessionRules()
  const removeIds = rules.map((r) => r.id)
  console.debug('sessionRules', rules)
  const newRules = [
    {
      id: tabId,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
        responseHeaders: [
          {
            header: 'X-Frame-Options',
            operation: chrome.declarativeNetRequest.HeaderOperation.REMOVE,
          },
        ],
      },
      condition: {
        resourceTypes: [chrome.declarativeNetRequest.ResourceType.SUB_FRAME],
        tabIds: [chrome.tabs.TAB_ID_NONE],
      },
    },
  ]
  await chrome.declarativeNetRequest.updateSessionRules({
    addRules: newRules,
    removeRuleIds: removeIds,
  })
}

const updateWindowSize = async (
  commandId: number,
  width: number,
  height: number,
) => {
  const obj = await UserSettings.get()
  const found = obj.commands.find((c) => c.id === commandId)
  if (found) {
    found.popupOption = {
      width,
      height,
    }
  }
  await UserSettings.set(obj)
}

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({
    url: 'options_page.html',
  })
})

chrome.windows.onFocusChanged.addListener(async (windowId: number) => {
  let windowIdHistory = (await bgVar.get<number[]>('windowIdHistory')) ?? []
  windowIdHistory.push(windowId)
  const beforeWindowId = windowIdHistory[windowIdHistory.length - 2]
  let lastWindow = await bgVar.get<LastWindow>('lastWindow')
  if (beforeWindowId && beforeWindowId == lastWindow?.id) {
    chrome.windows.remove(lastWindow?.id)
    windowIdHistory = windowIdHistory.filter((id) => id != lastWindow?.id)
  }
  bgVar.set('windowIdHistory', windowIdHistory)
})

chrome.windows.onBoundsChanged.addListener((window) => {
  bgVar.get<LastWindow>('lastWindow').then((lastWindow) => {
    if (lastWindow && lastWindow.id === window.id) {
      updateWindowSize(lastWindow.commandId, window.width, window.height)
    }
  })
})

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  let sidePanelTabId = await bgVar.get('sidePanelTabId')
  // console.debug('onActivated', tabId, sidePanelTabId)
  if (tabId !== sidePanelTabId) {
    // Disables the side panel on all other sites
    console.debug('disable sidePanel', tabId)
    await chrome.sidePanel.setOptions({
      tabId,
      enabled: false,
    })
  }
})
