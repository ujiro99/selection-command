import {
  isDebug,
  LINK_COMMAND_ENABLED,
  POPUP_ENABLED,
  OPTION_PAGE_PATH,
} from '@/const'
import '@/services/contextMenus'
import { Ipc, BgCommand, TabCommand } from '@/services/ipc'
import { Settings } from '@/services/settings'
import { PopupOption, PopupPlacement } from '@/services/defaultSettings'
import * as PageActionBackground from '@/services/pageAction/background'
import { BgData } from '@/services/backgroundData'
import { isSearchCommand, isPageActionCommand } from '@/lib/utils'
import { execute } from '@/action/background'
import * as ActionHelper from '@/action/helper'
import type { IpcCallback } from '@/services/ipc'
import type {
  WindowType,
  WindowLayer,
  CaptureData,
  CaptureDataStorage,
  CaptureScreenShotRes,
} from '@/types'
import { Storage, SESSION_STORAGE_KEY } from '@/services/storage'
import { openClipboardReader } from '@/services/chrome'

BgData.init()

type Sender = chrome.runtime.MessageSender

export type addPageRuleProps = {
  url: string
}

type addCommandProps = {
  command: string
}

const getTabId = (
  _: unknown,
  sender: Sender,
  response: (res: unknown) => void,
) => {
  response(sender.tab?.id)
  return true
}

const commandFuncs = {
  [BgCommand.openPopups]: ActionHelper.openPopups,
  [BgCommand.openPopupAndClick]: ActionHelper.openPopupAndClick,
  [BgCommand.openTab]: ActionHelper.openTab,
  [BgCommand.execApi]: ActionHelper.execApi,

  [BgCommand.openOption]: (): boolean => {
    chrome.tabs.create({
      url: OPTION_PAGE_PATH,
    })
    return false
  },

  [BgCommand.openShortcuts]: (): boolean => {
    chrome.tabs.create({
      url: 'chrome://extensions/shortcuts',
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
          popupPlacement: PopupPlacement,
          linkCommandEnabled: LINK_COMMAND_ENABLED.INHERIT,
        })
      }
      await Settings.set(
        {
          ...settings,
          pageRules,
        },
        true,
      )
      chrome.tabs.create({
        url: `${OPTION_PAGE_PATH}#pageRules`,
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
    const isSearch = isSearchCommand(params)
    const isPageAction = isPageActionCommand(params)

    const cmd = isSearch
      ? {
          id: params.id,
          title: params.title,
          searchUrl: params.searchUrl,
          iconUrl: params.iconUrl,
          openMode: params.openMode,
          openModeSecondary: params.openModeSecondary,
          spaceEncoding: params.spaceEncoding,
          popupOption: PopupOption,
        }
      : isPageAction
        ? {
            id: params.id,
            title: params.title,
            iconUrl: params.iconUrl,
            openMode: params.openMode,
            pageActionOption: params.pageActionOption,
            popupOption: PopupOption,
          }
        : null

    if (!cmd) {
      console.error('invalid command', param.command)
      response(false)
      return true
    }

    Settings.addCommands([cmd]).then(() => {
      response(true)
    })
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

  [BgCommand.captureScreenshot]: (
    _,
    sender: Sender,
    response: (res: CaptureScreenShotRes) => void,
  ): boolean => {
    const tabId = sender.tab?.id
    const windowId = sender.tab?.windowId
    if (!tabId || !windowId) {
      response({ success: false, error: 'TabId or WindowId not found.' })
      return true
    }

    chrome.tabs.captureVisibleTab(windowId, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        response({ success: false, error: chrome.runtime.lastError.message })
        return
      }
      response({ success: true, data: dataUrl })
    })
    return true
  },

  [BgCommand.addCapture]: (
    param: CaptureData,
    _: Sender,
    response: (res: unknown) => void,
  ): boolean => {
    try {
      Storage.update<CaptureDataStorage>(
        SESSION_STORAGE_KEY.TMP_CAPTURES,
        (captures) => ({
          ...captures,
          [param.id]: param.data,
        }),
      ).then(() => {
        response(true)
      })
    } catch (e) {
      console.error(e)
      response(false)
    }
    return false
  },

  [BgCommand.getTabId]: getTabId,

  [BgCommand.getClipboard]: (
    _: unknown,
    __: Sender,
    response: (res: unknown) => void,
  ): boolean => {
    openClipboardReader()
      .then((clipboardText) => {
        response(clipboardText)
      })
      .catch((error) => {
        console.error('Failed to read clipboard:', error)
        response(null)
      })
    return true
  },

  //
  // PageAction
  //
  [BgCommand.addPageAction]: PageActionBackground.add,
  [BgCommand.updatePageAction]: PageActionBackground.update,
  [BgCommand.removePageAction]: PageActionBackground.remove,
  [BgCommand.resetPageAction]: PageActionBackground.reset,
  [BgCommand.startPageActionRecorder]: PageActionBackground.openRecorder,
  [BgCommand.finishPageActionRecorder]: PageActionBackground.closeRecorder,
  [BgCommand.previewPageAction]: PageActionBackground.preview,
  [BgCommand.stopPageAction]: PageActionBackground.stopRunner,
  [BgCommand.openAndRunPageAction]: PageActionBackground.openAndRun,
} as { [key: string]: IpcCallback }

for (const key in BgCommand) {
  const command = BgCommand[key as keyof typeof BgCommand]
  Ipc.addListener(command, commandFuncs[key])
}

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
    url: OPTION_PAGE_PATH,
  })
})

chrome.windows.onFocusChanged.addListener(async (windowId: number) => {
  const data = BgData.get()
  const stack = data.windowStack

  // Close all popup windows when focus is lost (WINDOW_ID_NONE)
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    if (stack.length > 0) {
      for (const layer of stack) {
        for (const window of layer) {
          chrome.windows.remove(window.id)
        }
      }
      data.windowStack = []
      BgData.set(data)
    }
    return
  }

  // Close popup windows when focus changed to lower stack window
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

// Add command processing
chrome.commands.onCommand.addListener(async (commandName) => {
  try {
    // Get settings
    const settings = await Settings.get()
    const shortcut = settings.shortcuts?.shortcuts.find(
      (shortcut) => shortcut.commandId === commandName,
    )

    if (!shortcut) {
      console.warn(`No shortcut mapped for command: ${commandName}`)
      return
    }

    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true })
    const command = settings.commands.find(
      (c) => c.id === shortcut.targetCommandId,
    )
    if (!command) {
      console.warn(`Command not found: ${shortcut.targetCommandId}`)
      return
    }

    let ret: unknown
    let enableSendTab = tab?.id && !tab.url?.startsWith('chrome')
    if (enableSendTab && tab?.id) {
      // Execute command in tab
      ret = await Ipc.sendTab(tab.id, TabCommand.executeAction, {
        command,
      })
    }

    if (!enableSendTab || ret instanceof Error) {
      // Execute command directly in background
      await execute({
        command,
        position: { x: 10000, y: 10000 },
        selectionText: '',
        target: null,
      })
    }
  } catch (error) {
    console.error('Failed to execute shortcut command:', error)
  }
})
