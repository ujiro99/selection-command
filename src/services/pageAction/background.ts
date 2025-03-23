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
import { openPopups, OpenPopupsProps, getCurrentTab } from '@/services/chrome'
import {
  POPUP_TYPE,
  PAGE_ACTION_MAX,
  PAGE_ACTION_CONTROL,
  PAGE_ACTION_OPEN_MODE,
  EXEC_STATE,
} from '@/const'
import { generateRandomID } from '@/lib/utils'
import type {
  PageActionRecordingData,
  PageActionStep,
  PageActionContext,
  PopupOption,
} from '@/types'
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
  step: PageActionStep,
  sender: Sender,
  response: (res: unknown) => void,
): boolean => {
  const add = async () => {
    const option = await Storage.get<PageActionRecordingData>(
      SESSION_STORAGE_KEY.PA_RECORDING,
    )
    let steps = option.steps

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

    step.id = generateRandomID()
    const prev = steps.at(-1)

    if (prev != null) {
      if (step.type === 'click' && prev.type === 'click') {
        const selector = (step.param as PageAction.Input).selector
        const prevSelector = (prev.param as PageAction.Input).selector
        if (selector === prevSelector) {
          const t1 = step.timestamp!
          const t2 = prev.timestamp!
          if (t1 - t2 < 300) {
            return
          }
        }
      } else if (step.type === 'doubleClick' && prev.type === 'click') {
        // Removes a last click.
        steps.pop()
      } else if (step.type === 'doubleClick' && prev.type === 'doubleClick') {
        steps.pop()
      } else if (step.type === 'tripleClick' && prev.type === 'doubleClick') {
        steps.pop()
      } else if (step.type === 'tripleClick' && prev.type === 'tripleClick') {
        steps.pop()
      } else if (step.type === 'scroll' && prev.type === 'scroll') {
        steps.pop()
      } else if (step.type === 'input' && prev.type.match('input')) {
        const selector = (step.param as PageAction.Input).selector
        const prevSelector = (prev.param as PageAction.Input).selector
        if (selector === prevSelector) {
          // Combine operations on the same input element.
          steps.pop()
        }
      } else if (step.type === 'click' && prev.type.match('input')) {
        const selector = (step.param as PageAction.Input).selector
        const prevSelector = (prev.param as PageAction.Input).selector
        if (selector === prevSelector) {
          // Skip adding click to combine operations on the same input element.
          return
        }
      }
    }

    // Update actions.
    await Storage.set<PageActionRecordingData>(
      SESSION_STORAGE_KEY.PA_RECORDING,
      {
        ...option,
        steps: [
          ...steps,
          step,
          {
            ...EndAction,
            param: {
              label: 'End',
              url: sender.tab?.url ?? '',
            },
          },
        ],
      },
    )
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
    const option = await Storage.get<PageActionRecordingData>(
      SESSION_STORAGE_KEY.PA_RECORDING,
    )
    let steps = option.steps
    const index = steps.findIndex((a) => a.id === param.id)
    if (index !== -1 && isInputAction(steps[index].param)) {
      steps[index].param.value = param.value
      await Storage.set<PageActionRecordingData>(
        SESSION_STORAGE_KEY.PA_RECORDING,
        {
          ...option,
          steps,
        },
      )
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
    const option = await Storage.get<PageActionRecordingData>(
      SESSION_STORAGE_KEY.PA_RECORDING,
    )
    const steps = option.steps
    await Storage.set<PageActionRecordingData>(
      SESSION_STORAGE_KEY.PA_RECORDING,
      {
        ...option,
        steps: steps.filter((a) => a.id !== param.id),
      },
    )
    response(true)
  }
  remove()
  return true
}

export const reset = (_: any, sender: Sender): boolean => {
  const tabId = sender.tab?.id

  const reset = async () => {
    const option = await Storage.get<PageActionRecordingData>(
      SESSION_STORAGE_KEY.PA_RECORDING,
    )
    if (tabId && option.startUrl) {
      await chrome.tabs.update(tabId, { url: option.startUrl })
    }
    await Storage.set<PageActionRecordingData>(
      SESSION_STORAGE_KEY.PA_RECORDING,
      {
        ...option,
        steps: [],
      },
    )
  }
  reset()
  return false
}

type openAndRunProps = OpenPopupsProps & RunPageAction

export const openAndRun = (
  param: openAndRunProps,
  sender: Sender,
  response: (res: unknown) => void,
): boolean => {
  const open = async () => {
    let tabId: number

    if (param.openMode === PAGE_ACTION_OPEN_MODE.POPUP) {
      const tabIds = await openPopups(param)
      if (tabIds.length === 0) {
        console.error('tab not found')
        response(false)
        return
      }
      tabId = tabIds[0]
    } else {
      const tab = sender.tab ?? (await getCurrentTab())
      const newtab = await chrome.tabs.create({
        url: param.urls[0],
        windowId: tab.windowId,
        index: tab.index + 1,
      })
      tabId = newtab.id!
    }

    // Wait until ipc connection is established.
    await Ipc.ensureConnection(tabId)

    const commands = await Storage.getCommands()
    const cmd = commands.find((c) => c.id === param.commandId)
    if (cmd == null || cmd?.pageActionOption == null) {
      console.error('PageActionOption not found')
      response(false)
      return true
    }
    const steps = cmd.pageActionOption.steps
    const start = steps.find((s) => s.type === PAGE_ACTION_CONTROL.start)
    if (start) {
      // Remove the url to stop reload.
      ;(start.param as PageAction.Start).url = undefined
    }

    // Run the steps on the popup.
    run({ ...param, tabId, steps }, sender, response)
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

      // Check stop flag
      const stop = BgData.get().pageActionStop
      if (stop) {
        // Cancel the execution
        await RunningStatus.update(step.id, EXEC_STATE.Stop)
        break
      }

      try {
        // Execute
        await Ipc.ensureConnection(tabId)

        if (step.type === PAGE_ACTION_CONTROL.start) {
          // Reload tab
          const url = (step.param as PageAction.Start).url
          url && (await chrome.tabs.update(tabId, { url }))
          await RunningStatus.update(step.id, EXEC_STATE.Done)
          continue
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
      } catch (e) {
        await RunningStatus.update(step.id, EXEC_STATE.Failed, `${e}`)
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
  param: {
    startUrl: string
    openMode: PAGE_ACTION_OPEN_MODE
    size: PopupOption
    screen: ScreenSize
  },
  sender: Sender,
  response: (res: unknown) => void,
): boolean => {
  const { startUrl, openMode, size, screen } = param
  const open = async () => {
    const t = Math.floor((screen.height - size.height) / 2) + screen.top
    const l = Math.floor((screen.width - size.width) / 2) + screen.left
    if (openMode === PAGE_ACTION_OPEN_MODE.POPUP) {
      const w = await chrome.windows.create({
        url: startUrl,
        width: size.width,
        height: size.height,
        top: t,
        left: l,
        type: POPUP_TYPE.POPUP,
      })
      if (w.tabs) {
        await setRecordingTabId(w.tabs[0].id)
      } else {
        console.error('Failed to open the recorder.')
      }
    } else {
      const tab = sender.tab || (await getCurrentTab())
      const recorderTab = await chrome.tabs.create({
        url: startUrl,
        windowId: tab.windowId,
        index: tab.index + 1,
      })
      await setRecordingTabId(recorderTab.id)
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
    sender.tab && chrome.tabs.remove(sender.tab.id!)
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

chrome.windows.onBoundsChanged.addListener(
  async (window: chrome.windows.Window) => {
    const context = await Storage.get<PageActionContext>(
      SESSION_STORAGE_KEY.PA_CONTEXT,
    )
    const { recordingTabId } = context
    const tabs = await chrome.tabs.query({ windowId: window.id })
    const tab = tabs && tabs[0]
    if (tab && tab.id && tab.id === recordingTabId) {
      Ipc.sendTab(tab.id, TabCommand.sendWindowSize, {
        width: window.width,
        height: window.height,
      })
    }
  },
)
