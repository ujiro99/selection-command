import {
  Ipc,
  Sender,
  TabCommand,
  RunPageAction,
  ExecPageAction,
} from '@/services/ipc'
import { Storage, SESSION_STORAGE_KEY } from '@/services/storage'
import type { PageAction } from '@/services/pageAction'
import { isInputAction, RunningStatus } from '@/services/pageAction'
import { ScreenSize } from '@/services/dom'
import { openPopups, openPopupsProps } from '@/services/chrome'
import {
  POPUP_OPTION,
  POPUP_TYPE,
  PAGE_ACTION_MAX,
  PAGE_ACTION_CONTROL,
  EXEC_STATE,
} from '@/const'
import { generateRandomID } from '@/lib/utils'
import type { PageActionStep, PageActionContext } from '@/types'
import { BgData } from '@/services/backgroundData'

BgData.init()

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

type openPopupAndRunProps = openPopupsProps & RunPageAction

export const openPopupAndRun = (
  param: openPopupAndRunProps,
  _: Sender,
  response: (res: unknown) => void,
): boolean => {
  const open = async () => {
    const tabIds = await openPopups(param)
    if (tabIds.length === 0) {
      console.error('tab not found')
      response(false)
      return
    }
    const tabId = tabIds[0]

    // Wait until ipc connection is established.
    await Ipc.connectTab(tabId)

    const commands = await Storage.getCommands()
    const cmd = commands.find((c) => c.id === param.commandId)
    if (cmd == null || cmd?.pageActionOption == null) {
      console.error('PageActionOption not found')
      response(false)
      return true
    }
    const steps = cmd.pageActionOption.steps

    // Run the steps on the popup.
    run({ ...param, tabId, steps }, _, response)
  }
  open()
  return true
}

export const run = (
  param: RunPageAction,
  sender: Sender,
  response: (res: unknown) => void,
): boolean => {
  const { steps, selectedText, clipboardText, srcUrl } = param
  const tabId = param.tabId || sender.tab?.id
  if (tabId == null) {
    console.error('tabId not found')
    response(false)
    return true
  }

  const run = async () => {
    // Update running status
    RunningStatus.init(tabId, steps)
    BgData.set((data) => ({ ...data, pageActionStop: false }))

    // Run steps
    for (const step of steps) {
      await RunningStatus.update(step.id, EXEC_STATE.Start)

      const stop = BgData.get().pageActionStop
      if (stop) {
        // Cancel the execution
        await RunningStatus.update(step.id, EXEC_STATE.Stop)
        break
      }

      const ret = await Ipc.sendTab<
        ExecPageAction.Message,
        ExecPageAction.Return
      >(tabId, TabCommand.execPageAction, {
        step,
        srcUrl,
        selectedText,
        clipboardText,
      })

      if (ret.result) {
        await RunningStatus.update(step.id, EXEC_STATE.Done)
      } else {
        await RunningStatus.update(step.id, EXEC_STATE.Failed, ret.message)
        break
      }
    }
    response(true)
  }
  run()
  return true
}

export const stopRunner = (): boolean => {
  BgData.set((data) => ({ ...data, pageActionStop: true }))
  return false
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
