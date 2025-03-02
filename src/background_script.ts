import {
  isDebug,
  LINK_COMMAND_ENABLED,
  POPUP_ENABLED,
  POPUP_OFFSET,
  POPUP_TYPE,
  POPUP_PLACEMENT,
} from '@/const'
import { Ipc, BgCommand, TabCommand } from '@/services/ipc'
import type { IpcCallback } from '@/services/ipc'
import { escapeJson } from '@/lib/utils'
import type { ScreenSize } from '@/services/dom'
import { Settings } from '@/services/settings'
import type { CommandVariable } from '@/types'
import { Storage, STORAGE_KEY, STORAGE_AREA } from '@/services/storage'
import '@/services/contextMenus'
import { PopupOption } from '@/services/defaultSettings'

const OPTION_PAGE = 'src/options_page.html'

type WindowType = {
  id: number
  commandId: string
  srcWindowId: number
}

type WindowLayer = WindowType[]

class BgData {
  private static instance: BgData

  public windowStack: WindowLayer[]
  public normalWindows: WindowLayer

  private constructor(val: BgData | undefined) {
    this.windowStack = val?.windowStack ?? []
    this.normalWindows = val?.normalWindows ?? []
  }

  public static init() {
    if (!BgData.instance) {
      Storage.get<BgData>(STORAGE_KEY.BG, STORAGE_AREA.LOCAL).then(
        (val: BgData) => {
          BgData.instance = new BgData(val)
          console.debug('BgData initialized', BgData.instance)
        },
      )
    }
  }

  public static get(): BgData {
    return BgData.instance
  }

  public static set(val: BgData) {
    BgData.instance = val
    Storage.set(STORAGE_KEY.BG, BgData.instance, STORAGE_AREA.LOCAL)
  }
}

BgData.init()

type Sender = chrome.runtime.MessageSender

export type openPopupsProps = {
  commandId: string
  urls: string[]
  top: number
  left: number
  width: number
  height: number
  screen: ScreenSize
  type: POPUP_TYPE
}

export type openPopupAndClickProps = openPopupsProps & {
  selector: string
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

type addCommandProps = {
  command: string
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

const openPopups = async (param: openPopupsProps): Promise<number[]> => {
  const { top, left, width, height, screen } = param
  const current = await chrome.windows.getCurrent()
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
    const data = BgData.get()
    if (type === POPUP_TYPE.POPUP) {
      data.windowStack.push(layer)
    } else {
      data.normalWindows = layer
    }
    BgData.set(data)
  }

  const tabIds = windows.reduce((tabIds, w) => {
    w.tabs?.forEach((t) => t.id && tabIds.push(t.id))
    return tabIds
  }, [] as number[])
  updateRules(tabIds)

  return tabIds
}

const commandFuncs = {
  [BgCommand.openPopups]: (param: openPopupsProps): boolean => {
    openPopups(param)
    return false
  },

  [BgCommand.openPopupAndClick]: (param: openPopupAndClickProps): boolean => {
    const open = async () => {
      const tabIds = await openPopups(param)
      if (tabIds.length > 0) {
        await Ipc.sendQueue(tabIds[0], TabCommand.clickElement, {
          selector: (param as { selector: string }).selector,
        })
        return
      }
      console.debug('tab not found')
    }
    open()
    return false
  },

  [BgCommand.openOption]: (): boolean => {
    chrome.tabs.create({
      url: OPTION_PAGE,
    })
    return false
  },

  [BgCommand.addPageRule]: (param: addPageRuleProps): boolean => {
    const add = async () => {
      const settings = await Settings.get()
      const pageRules = settings.pageRules ?? []
      if (pageRules.find((r) => r.urlPattern === param.url) == null) {
        pageRules.push({
          urlPattern: param.url,
          popupEnabled: POPUP_ENABLED.ENABLE,
          popupPlacement: POPUP_PLACEMENT.TOP_START,
          linkCommandEnabled: LINK_COMMAND_ENABLED.INHERIT,
        })
      }
      await Settings.set({
        ...settings,
        pageRules,
      })
      chrome.tabs.create({
        url: `${OPTION_PAGE}#root_pageRules`,
      })
    }
    add()
    return false
  },

  [BgCommand.addCommand]: (
    param: addCommandProps,
    _: Sender,
    response: (res: unknown) => void,
  ): boolean => {
    const params = JSON.parse(param.command)
    const cmd = {
      id: params.id,
      title: params.title,
      searchUrl: params.searchUrl,
      iconUrl: params.iconUrl,
      openMode: params.openMode,
      openModeSecondary: params.openModeSecondary,
      spaceEncoding: params.spaceEncoding,
      popupOption: PopupOption,
    }
    Settings.addCommands([cmd]).then(() => {
      response(true)
    })
    return true
  },

  [BgCommand.openTab]: (param: openTabProps, sender: Sender): boolean => {
    const open = async () => {
      const tab = sender.tab ?? (await getCurrentTab())
      chrome.tabs.create({
        ...param,
        windowId: tab.windowId,
        index: tab.index + 1,
      })
    }
    open()
    return false
  },

  [BgCommand.execApi]: (
    param: execApiProps,
    _: Sender,
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
      const exec = async () => {
        const res = await fetch(url, opt)
        const json = await res.json()
        response({ ok: res.ok, res: json })
      }
      exec()
    } catch (e) {
      console.error(e)
      response({ ok: false, res: e })
    }
    // return async
    return true
  },

  [BgCommand.canOpenInTab]: (
    _: unknown,
    sender: Sender,
    response: (res: unknown) => void,
  ): boolean => {
    const data = BgData.get()
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
    _: unknown,
    sender: Sender,
    response: (res: unknown) => void,
  ): boolean => {
    let w: WindowType | undefined

    const data = BgData.get()
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

  [BgCommand.toggleStar]: (
    param: { id: string },
    _: Sender,
    response: (res: unknown) => void,
  ): boolean => {
    const toggle = async () => {
      const settings = await Settings.get()
      const idx = settings.stars.findIndex((s) => s.id === param.id)
      if (idx >= 0) {
        settings.stars.splice(idx, 1)
      } else {
        settings.stars.push({
          id: param.id,
        })
      }
      await Settings.set(settings, true)
      response(true)
    }
    toggle()
    return true
  },
} as { [key: string]: IpcCallback }

for (const key in BgCommand) {
  const command = BgCommand[key as keyof typeof BgCommand]
  Ipc.addListener(command, commandFuncs[key])
}

const getTabId = (
  _: unknown,
  sender: Sender,
  response: (res: unknown) => void,
) => {
  response(sender.tab?.id)
  return true
}
Ipc.addListener(TabCommand.getTabId, getTabId as IpcCallback)

const updateWindowSize = async (
  commandId: string,
  width: number,
  height: number,
) => {
  const obj = await Settings.get()
  const found = obj.commands.find((c) => c.id === commandId)
  if (found) {
    found.popupOption = {
      width,
      height,
    }
    await Settings.updateCommands([found])
  } else {
    console.warn('command not found', commandId)
  }
}

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({
    url: OPTION_PAGE,
  })
})

chrome.windows.onFocusChanged.addListener(async (windowId: number) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    return
  }

  // Close popup windows when focus changed to lower stack window
  const data = BgData.get()
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

chrome.windows.onRemoved.addListener((windowId: number) => {
  const data = BgData.get()
  const idx = data.normalWindows?.findIndex((w) => w.id === windowId)
  if (idx >= 0) {
    data.normalWindows.splice(idx, 1)
    BgData.set(data)
    return
  }
})

chrome.windows.onBoundsChanged.addListener((window) => {
  const data = BgData.get()
  for (const layer of [...data.windowStack, data.normalWindows]) {
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

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.session.setAccessLevel({
    accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS',
  })
})

// for debug
// chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(
//   (details: chrome.declarativeNetRequest.MatchedRuleInfoDebug) => {
//     console.debug(details)
//   },
// )

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
