import * as mv3 from 'mv3-hot-reload'
import { isDebug, POPUP_ENABLED } from '@/const'
import { Ipc, BgCommand, TabCommand } from '@/services/ipc'
import type { IpcCallback } from '@/services/ipc'
import { escapeJson } from '@/services/util'
import type { ScreenSize } from '@/services/util'
import { UserSettings } from '@/services/userSettings'
import type { CommandVariable } from '@/types'
import { Storage, STORAGE_KEY, STORAGE_AREA } from '@/services/storage'
import '@/services/contextMenus'

mv3.utils.setConfig({ isDev: isDebug })
mv3.background.init()

type WindowType = {
  id: number
  commandId: number
  srcWindowId: number
}

type WindowLayer = WindowType[]

class BgData {
  private static instance: BgData

  public windowStack: WindowLayer[]

  private constructor() {
    this.windowStack = []

    Storage.get<BgData>(STORAGE_KEY.BG, STORAGE_AREA.LOCAL).then(
      (val: BgData) => {
        if (val) {
          BgData.instance = val
        }
      },
    )
  }

  public static get(): BgData {
    if (!BgData.instance) {
      BgData.instance = new BgData()
    }
    return BgData.instance
  }

  public static set(val: BgData) {
    BgData.instance = val
    Storage.set(STORAGE_KEY.BG, BgData.instance, STORAGE_AREA.LOCAL)
  }
}

const data = BgData.get()

type Sender = chrome.runtime.MessageSender

export type openPopupsProps = {
  commandId: number
  urls: string[]
  top: number
  left: number
  width: number
  height: number
  screen: ScreenSize
}

export type execApiProps = {
  url: string
  pageUrl: string
  pageTitle: string
  selectionText: string
  fetchOptions: string
  variables: CommandVariable[]
}

export type openTabProps = {
  url: string
  active: boolean
}

export type addPageRuleProps = {
  url: string
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
    const re = new RegExp(`\\$\\{${v.name}\\}`, 'g')
    res = res.replace(re, v.value)
  }
  return res
}

async function getCurrentTab() {
  const queryOptions = { active: true, lastFocusedWindow: true }
  const [tab] = await chrome.tabs.query(queryOptions)
  return tab
}

const commandFuncs = {
  [BgCommand.openPopups]: (param: openPopupsProps): boolean => {
    const open = async () => {
      const { top, left, width, height, screen } = param
      const current = await chrome.windows.getCurrent()
      const offset = 50
      const windows = await Promise.all(
        param.urls.reverse().map((url, idx) => {
          let t = top + offset * idx
          let l = left + offset * (idx + 1)

          // If the window extends beyond the screen size,
          // return the display position to the center.
          if (screen.height < t + height - screen.top) {
            t =
              Math.floor((screen.height - height) / 2) +
              screen.top +
              offset * idx
          }
          if (screen.width < l + width - screen.left) {
            l =
              Math.floor((screen.width - width) / 2) +
              screen.left +
              offset * (idx + 1)
          }
          return chrome.windows.create({
            url,
            width: width,
            height: height,
            top: t,
            left: l,
            type: 'popup',
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
        data.windowStack.push(layer)
        BgData.set(data)
      }
    }
    open()
    return false
  },

  [BgCommand.openOption]: (param: unknown, sender: Sender): boolean => {
    chrome.tabs.create({
      url: 'options_page.html',
    })
    return false
  },

  [BgCommand.addPageRule]: (param: addPageRuleProps): boolean => {
    const add = async () => {
      const settings = await UserSettings.get()
      const pageRules = settings.pageRules ?? []
      if (pageRules.find((r) => r.urlPattern === param.url) == null) {
        pageRules.push({
          urlPattern: param.url,
          popupEnabled: POPUP_ENABLED.ENABLE,
          popupPlacement: 'top-start',
        })
      }
      await UserSettings.set({
        ...settings,
        pageRules,
      })
      chrome.tabs.create({
        url: `options_page.html#root_pageRules`,
      })
    }
    add()
    return false
  },

  [BgCommand.openTab]: (param: openTabProps, sender: Sender): boolean => {
    getCurrentTab().then((tab) => {
      const index = tab.index
      chrome.tabs.create({
        ...param,
        index: index + 1,
      })
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
        text: escapeJson(escapeJson(selectionText)),
      })
      const opt = JSON.parse(str)
        ; (async () => {
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

  [BgCommand.canOpenInTab]: (
    param: unknown,
    sender: Sender,
    response: (res: unknown) => void,
  ): boolean => {
    for (const layer of data.windowStack) {
      for (const window of layer) {
        if (window.id === sender.tab?.windowId) {
          // found!
          response(true)
          break
        }
      }
    }
    return false
  },

  [BgCommand.openInTab]: (
    param: unknown,
    sender: Sender,
    response: (res: unknown) => void,
  ): boolean => {
    let w: WindowType | undefined
    for (const layer of data.windowStack) {
      for (const window of layer) {
        if (window.id === sender.tab?.windowId) {
          w = window
          break
        }
      }
    }
    if (!w) {
      console.warn('window not found', sender.tab?.windowId)
      chrome.tabs.create({ url: sender.url })
      chrome.windows.remove(sender.tab?.windowId as number)
      response(true)
      return true
    }

    let targetId: number | undefined
    chrome.windows
      .get(w.srcWindowId)
      .then((window) => {
        targetId = window.id
      })
      .catch(async () => {
        const current = await chrome.windows.getCurrent()
        targetId = current.id
        console.warn(
          `source window(${w.srcWindowId}) not found, use current(${current.id}) instead.`,
        )
      })
      .finally(() => {
        if (targetId) {
          chrome.tabs.create({
            url: sender.url,
            windowId: targetId,
          })
          chrome.windows.remove(sender.tab?.windowId as number)
          response(true)
        }
        response(false)
      })

    // return async
    return true
  },
} as { [key: string]: IpcCallback }

for (const key in BgCommand) {
  const command = BgCommand[key as keyof typeof BgCommand]
  Ipc.addListener(command, commandFuncs[key])
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
    await UserSettings.updateCommands([found])
  } else {
    console.warn('command not found', commandId)
  }
}

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({
    url: 'options_page.html',
  })
})

chrome.windows.onFocusChanged.addListener(async (windowId: number) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    return
  }

  // Close popup windows when focus changed to lower stack window
  const stack = data.windowStack
  const idx = stack.map((s) => s.findIndex((w) => w.id === windowId))

  // Close all window.
  let closeStack = [] as WindowLayer[]
  const closeAll = idx.every((i) => i < 0)
  if (closeAll && stack.length > 0) {
    closeStack = stack
    data.windowStack = []
  }

  // Close windows up to the window stack in focus.
  for (let i = idx.length - 2; i >= 0; i--) {
    if (idx[i] >= 0) {
      closeStack = stack.splice(i + 1)
      data.windowStack = stack
      break
    }
  }

  // execute close
  if (closeStack.length > 0) {
    for (const layer of closeStack) {
      for (const window of layer) {
        chrome.windows.remove(window.id)
      }
    }
  }

  BgData.set(data)
})

chrome.windows.onBoundsChanged.addListener((window) => {
  for (const layer of data.windowStack) {
    const w = layer.find((v) => v.id === window.id)
    if (w) {
      if (w.id === window.id && window.width && window.height) {
        updateWindowSize(w.commandId, window.width, window.height)
        return
      }
    }
  }
})

chrome.tabs.onActivated.addListener(async () => {
  // Force close the menu
  const ret = await Ipc.sendAllTab(TabCommand.closeMenu)
  ret.filter((v) => v).forEach((v) => console.debug(v))
})

if (isDebug) {
  chrome.action.setIcon({
    path: {
      128: '/icon128-dev.png',
    },
  })
}

chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((details) => {
  console.debug(details)
})

const updateRules = async () => {
  const oldRules = await chrome.declarativeNetRequest.getDynamicRules()
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
          urlFilter: '*',
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
          urlFilter: '*',
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
          urlFilter: '*',
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
updateRules()
