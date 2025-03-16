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
import { openPopups, openPopupsProps } from '@/services/chrome'

const StartAction = {
  id: generateRandomID(),
  type: PAGE_ACTION_CONTROL.start,
}

const EndAction = {
  id: generateRandomID(),
  type: PAGE_ACTION_CONTROL.end,
}

export const add = (
  action: PageActionStep,
  sender: Sender,
  response: (res: unknown) => void,
): boolean => {
  const add = async () => {
    let steps = await Storage.get<PageActionStep[]>(
      SESSION_STORAGE_KEY.PA_RECORDING,
    )

    // Insert a start action if steps are empty.
    if (steps.length === 0) {
      steps.push({
        ...StartAction,
        param: {
          label: 'Start',
          url: sender.tab?.url ?? '',
        },
      })
    }

    // Remove a end ation.
    steps = steps.filter((a) => a.type !== 'end')

    // - 1 : End action
    if (steps.length >= PAGE_ACTION_MAX - 1) {
      response(true)
      return
    }

    action.id = generateRandomID()
    const prev = steps.at(-1)

    if (prev != null) {
      if (action.type === 'doubleClick' && prev.type === 'click') {
        // Removes a last click.
        steps.pop()
      } else if (action.type === 'tripleClick' && prev.type === 'doubleClick') {
        // Removes a last double click.
        steps.pop()
      } else if (action.type === 'scroll' && prev.type === 'scroll') {
        steps.pop()
      } else if (action.type === 'input' && prev.type.match('input')) {
        const selector = (action.param as PageAction.Input).selector
        const prevSelector = (prev.param as PageAction.Input).selector
        if (selector === prevSelector) {
          // Combine operations on the same input element.
          steps.pop()
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
    await Storage.set(SESSION_STORAGE_KEY.PA_RECORDING, [
      ...steps,
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
      SESSION_STORAGE_KEY.PA_RECORDING,
    )
    const index = actions.findIndex((a) => a.id === param.id)
    if (index !== -1 && isInputAction(actions[index].param)) {
      actions[index].param.value = param.value
      await Storage.set(SESSION_STORAGE_KEY.PA_RECORDING, actions)
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
      SESSION_STORAGE_KEY.PA_RECORDING,
    )
    await Storage.set(
      SESSION_STORAGE_KEY.PA_RECORDING,
      actions.filter((a) => a.id !== param.id),
    )
    response(true)
  }
  remove()
  return true
}

export const reset = (): boolean => {
  const reset = async () => {
    await Storage.set(SESSION_STORAGE_KEY.PA_RECORDING, [])
  }
  reset()
  return false
}

type openPopupAndRunParam = openPopupsProps & {
  srcUrl: string
  selectedText: string
  clipboardText: string
}

export const openPopupAndRun = (param: openPopupAndRunParam): boolean => {
  const { commandId, selectedText, clipboardText, srcUrl } = param
  const open = async () => {
    const commands = await Storage.getCommands()
    const cmd = commands.find((c) => c.id === commandId)
    if (cmd == null || cmd?.pageActionOption == null) {
      console.error('PageActionOption not found')
      return
    }
    const tabIds = await openPopups(param)
    if (tabIds.length > 0) {
      const option = cmd.pageActionOption
      await Ipc.sendQueue(tabIds[0], TabCommand.runPageAction, {
        srcUrl,
        selectedText,
        clipboardText,
        steps: option.steps,
      })
      return
    }
    console.debug('tab not found')
  }
  open()
  return false
}

type startPageAction = {
  steps: PageActionStep[]
}

export const queueSteps = (
  param: startPageAction,
  sender: Sender,
  response: (res: unknown) => void,
): boolean => {
  const run = async () => {
    const { steps } = param
    const tabId = sender.tab?.id
    if (tabId == null) return response(true)
    for (const step of steps) {
      await Ipc.sendQueue(tabId, TabCommand.execPageAction, step)
    }
    response(true)
  }
  run()
  return true
}

const setRecordingTabId = async (tabId: number | undefined) => {
  const context = await Storage.get<PageActionContext>(
    SESSION_STORAGE_KEY.PA_CONTEXT,
  )
  await Storage.set(SESSION_STORAGE_KEY.PA_CONTEXT, {
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

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const context = await Storage.get<PageActionContext>(
    SESSION_STORAGE_KEY.PA_CONTEXT,
  )
  const { recordingTabId } = context
  if (tabId === recordingTabId) {
    // Reset the recording tab id if recording.
    setRecordingTabId(undefined)
  }
})
