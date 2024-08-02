import * as mv3 from 'mv3-hot-reload'
import { isDebug } from './const'
import { Ipc, BgCommand } from './services/ipc'
import type { IpcCallback } from './services/ipc'
import { escapeJson } from '@/services/util'
import type { ScreenSize } from '@/services/util'
import { UserSettings, migrate } from './services/userSettings'
import type { CommandVariable } from './services/userSettings'
import { Storage, STORAGE_KEY, STORAGE_AREA } from './services/storage'

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
      response(false)
      return false
    }

    let targetId: number | undefined
    chrome.windows
      .get(w.srcWindowId)
      .then(async (window) => {
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
  }
  await UserSettings.set(obj)
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
  let deleteStack = [] as WindowLayer[]

  // Close all window.
  const closeAll = idx.every((i) => i < 0)
  if (closeAll && stack.length > 0) {
    deleteStack = stack
    data.windowStack = []
  }

  // Close windows up to the window stack in focus.
  for (let i = idx.length - 2; i >= 0; i--) {
    if (idx[i] >= 0) {
      deleteStack = stack.splice(i + 1)
      data.windowStack = stack
      break
    }
  }

  // execute close
  if (deleteStack.length > 0) {
    for (const layer of deleteStack) {
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
  Ipc.sendAllTab(BgCommand.closeMenu)
})

chrome.runtime.onInstalled.addListener((details) => {
  // migration
  console.log('onInstalled', details)
  if (details.reason === 'update' && details.previousVersion === '0.5.0') {
    migrate()
    return
  }
})
