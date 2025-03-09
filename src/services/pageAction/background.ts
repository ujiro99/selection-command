import { Ipc, Sender, TabCommand } from '@/services/ipc'
import { Storage, SESSION_STORAGE_KEY } from '@/services/storage'
import {
  POPUP_OPTION,
  POPUP_TYPE,
  PAGE_ACTION_MAX,
  PAGE_ACTION_CONTROL,
} from '@/const'
import { generateRandomID } from '@/lib/utils'
import type { PageActionStep, PageActionContext } from '@/types'
import type { PageAction } from '@/services/pageAction'
import { isInputAction } from '@/services/pageAction'
import { ScreenSize } from '@/services/dom'

const StartAction = {
  type: PAGE_ACTION_CONTROL.start,
  id: generateRandomID(),
  url: '',
}

const EndAction = {
  type: PAGE_ACTION_CONTROL.end,
  id: generateRandomID(),
}

export const add = (
  action: PageActionStep,
  sender: Sender,
  response: (res: unknown) => void,
): boolean => {
  const add = async () => {
    let actions = await Storage.get<PageActionStep[]>(
      SESSION_STORAGE_KEY.PAGE_ACTION,
    )

    // Insert a start action if actions are empty.
    if (actions.length === 0) {
      actions.push({
        ...StartAction,
        param: {
          label: 'Start',
          url: sender.tab?.url ?? '',
        },
      })
    }

    // Remove a end ation.
    actions = actions.filter((a) => a.type !== 'end')

    // - 1 : End action
    if (actions.length >= PAGE_ACTION_MAX - 1) {
      response(true)
      return
    }

    action.id = generateRandomID()
    const prev = actions.at(-1)

    if (prev != null) {
      if (action.type === 'doubleClick' && prev.type === 'click') {
        // Removes a last click.
        actions.pop()
      } else if (action.type === 'tripleClick' && prev.type === 'doubleClick') {
        // Removes a last double click.
        actions.pop()
      } else if (action.type === 'scroll' && prev.type === 'scroll') {
        actions.pop()
      } else if (action.type === 'input' && prev.type.match('input')) {
        const selector = (action.param as PageAction.Input).selector
        const prevSelector = (prev.param as PageAction.Input).selector
        if (selector === prevSelector) {
          // Combine operations on the same input element.
          actions.pop()
        }
      } else if (action.type === 'click' && prev.type.match('input')) {
        const selector = (action.param as PageAction.Input).selector
        const prevSelector = (prev.param as PageAction.Input).selector
        if (selector === prevSelector) {
          // Skip adding click to combine operations on the same input element.
          return
        }
      }
    }

    // Update actions.
    await Storage.set(SESSION_STORAGE_KEY.PAGE_ACTION, [
      ...actions,
      action,
      {
        ...EndAction,
        param: {
          label: 'End',
          url: sender.tab?.url ?? '',
        },
      },
    ])
    response(true)
  }
  add()
  return true
}

export const update = (
  param: { id: string; value: string },
  _: Sender,
  response: (res: unknown) => void,
): boolean => {
  const update = async () => {
    let actions = await Storage.get<PageActionStep[]>(
      SESSION_STORAGE_KEY.PAGE_ACTION,
    )
    const index = actions.findIndex((a) => a.id === param.id)
    if (index !== -1 && isInputAction(actions[index].param)) {
      actions[index].param.value = param.value
      await Storage.set(SESSION_STORAGE_KEY.PAGE_ACTION, actions)
    }
    response(true)
  }
  update()
  return true
}

export const remove = (
  param: { id: string },
  _: Sender,
  response: (res: unknown) => void,
): boolean => {
  const remove = async () => {
    let actions = await Storage.get<PageActionStep[]>(
      SESSION_STORAGE_KEY.PAGE_ACTION,
    )
    await Storage.set(
      SESSION_STORAGE_KEY.PAGE_ACTION,
      actions.filter((a) => a.id !== param.id),
    )
    response(true)
  }
  remove()
  return true
}

export const reset = (): boolean => {
  const reset = async () => {
    await Storage.set(SESSION_STORAGE_KEY.PAGE_ACTION, [])
  }
  reset()
  return false
}

export const execute = (
  _: unknown,
  sender: Sender,
  response: (res: unknown) => void,
): boolean => {
  const queue = async () => {
    const actions = await Storage.get<PageActionStep[]>(
      SESSION_STORAGE_KEY.PAGE_ACTION,
    )
    const tabId = sender.tab?.id
    if (tabId != null) {
      for (const action of actions) {
        await Ipc.sendQueue(
          tabId,
          TabCommand.executePageAction,
          action as PageActionStep,
        )
      }
    }
    response(true)
  }
  queue()
  return true
}

const setRecordingTabId = async (tabId: number | undefined) => {
  const context = await Storage.get<PageActionContext>(
    SESSION_STORAGE_KEY.PAGE_ACTION_CONTEXT,
  )
  await Storage.set(SESSION_STORAGE_KEY.PAGE_ACTION_CONTEXT, {
    ...context,
    recordingTabId: tabId,
  })
}

export const openRecorder = (
  param: { startUrl: string; screen: ScreenSize },
  _sender: Sender,
  response: (res: unknown) => void,
): boolean => {
  const { startUrl, screen } = param
  const open = async () => {
    const t = Math.floor((screen.height - POPUP_OPTION.height) / 2) + screen.top
    const l = Math.floor((screen.width - POPUP_OPTION.width) / 2) + screen.left
    const w = await chrome.windows.create({
      url: startUrl,
      width: POPUP_OPTION.width,
      height: POPUP_OPTION.height,
      top: t,
      left: l,
      type: POPUP_TYPE.POPUP,
    })
    if (w.tabs) {
      await setRecordingTabId(w.tabs[0].id)
    } else {
      console.error('Failed to open the recorder.')
    }
    response(true)
  }
  open()
  return true
}

export const closeRecorder = (
  _param: any,
  sender: Sender,
  response: (res: unknown) => void,
): boolean => {
  setRecordingTabId(undefined).then(() => {
    sender?.tab && chrome.windows.remove(sender.tab.windowId)
    response(true)
  })
  return true
}
