import {
  Ipc,
  Sender,
  TabCommand,
  RunPageAction,
  ExecPageAction,
} from '@/services/ipc'
import { Storage, SESSION_STORAGE_KEY } from '@/services/storage'
import type { PageAction } from '@/services/pageAction'
import { RunningStatus } from '@/services/pageAction'
import { ScreenSize } from '@/services/dom'
import { openPopups, OpenPopupsProps, getCurrentTab } from '@/services/chrome'
import {
  POPUP_TYPE,
  PAGE_ACTION_MAX,
  PAGE_ACTION_CONTROL,
  PAGE_ACTION_OPEN_MODE,
  EXEC_STATE,
  PAGE_ACTION_EVENT as EVENT,
  PAGE_ACTION_TIMEOUT as TIMEOUT,
} from '@/const'
import {
  generateRandomID,
  isPageActionCommand,
  isUrl,
  sleep,
} from '@/lib/utils'
import type {
  PageActionRecordingData,
  PageActionStep,
  PageActionContext,
  PopupOption,
  DeepPartial,
} from '@/types'
import { BgData } from '@/services/backgroundData'

BgData.init()

const StartAction = {
  id: generateRandomID(),
  type: PAGE_ACTION_CONTROL.start,
  delayMs: 0,
  skipRenderWait: false,
}

const EndAction = {
  id: generateRandomID(),
  type: PAGE_ACTION_CONTROL.end,
  delayMs: 0,
  skipRenderWait: false,
}

const DELAY_AFTER_URL_CHANGED = 100

export const add = (
  step: PageActionStep,
  _sender: Sender,
  response: (res: unknown) => void,
): boolean => {
  const add = async () => {
    const type = step.param.type
    const option = await Storage.get<PageActionRecordingData>(
      SESSION_STORAGE_KEY.PA_RECORDING,
    )
    let steps = option.steps
    const context = await Storage.get<PageActionContext>(
      SESSION_STORAGE_KEY.PA_CONTEXT,
    )

    // Insert a start action if steps are empty.
    if (steps.length === 0) {
      steps.push({
        ...StartAction,
        param: {
          type: PAGE_ACTION_CONTROL.start,
          label: 'Start',
        },
      })
    }

    // Remove a end ation.
    steps = steps.filter((s) => s.param.type !== 'end')

    // - 1 : End action
    if (steps.length >= PAGE_ACTION_MAX - 1) {
      response(true)
      return
    }

    const prev = steps.at(-1)
    const prevType = prev?.param.type

    if (prev != null) {
      if (type === 'click' && prevType === 'click') {
        const selector = (step.param as PageAction.Click).selector
        const prevSelector = (prev.param as PageAction.Click).selector
        if (selector === prevSelector) {
          const t1 = step.timestamp!
          const t2 = prev.timestamp!
          if (t1 - t2 < 300) {
            return
          }
        }
      } else if (type === 'doubleClick' && prevType === 'click') {
        // Removes a last click.
        steps.pop()
      } else if (type === 'doubleClick' && prevType === 'doubleClick') {
        steps.pop()
      } else if (type === 'tripleClick' && prevType === 'doubleClick') {
        steps.pop()
      } else if (type === 'tripleClick' && prevType === 'tripleClick') {
        steps.pop()
      } else if (type === 'scroll') {
        if (context.urlChanged) {
          step.delayMs = DELAY_AFTER_URL_CHANGED
        }
        if (prevType === 'scroll') {
          steps.pop()
          step.delayMs = prev.delayMs
        }
      } else if (type === EVENT.keyboard) {
        if (context.urlChanged) {
          step.delayMs = DELAY_AFTER_URL_CHANGED
        }
      } else if (type === 'input') {
        // Combine operations on the same input element.
        if (prevType === 'input') {
          const selector = (step.param as PageAction.Input).selector
          const prevSelector = (prev.param as PageAction.Input).selector
          if (selector === prevSelector) {
            steps.pop()
            // Use same label.
            step.param.label = prev.param.label
          }
        }
        // Remove the vlaue in previous input if the same element has been input.
        const param = step.param as PageAction.Input
        const prevInput = steps.filter((a) => a.param.type === 'input').pop()
        if (prevInput) {
          const prevParam = prevInput.param as PageAction.Input
          if (param.selector === prevParam.selector) {
            param.value = param.value.replace(prevParam.value, '')
          }
        }
      } else if (type === 'click' && prevType === 'input') {
        const selector = (step.param as PageAction.Click).selector
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
              type: PAGE_ACTION_CONTROL.end,
              label: 'End',
            },
          },
        ],
      },
    )

    // Reset the url changed flag.
    Storage.update<PageActionContext>(
      SESSION_STORAGE_KEY.PA_CONTEXT,
      (data) => ({
        ...data,
        urlChanged: false,
      }),
    )
    response(true)
  }
  add()
  return true
}

export const update = (
  param: { id: string; partial: DeepPartial<PageActionStep> },
  _: Sender,
  response: (res: unknown) => void,
): boolean => {
  const update = async () => {
    const option = await Storage.get<PageActionRecordingData>(
      SESSION_STORAGE_KEY.PA_RECORDING,
    )
    const steps = option.steps
    const index = steps.findIndex((s) => s.id === param.id)
    if (index !== -1) {
      const step = steps[index]
      steps[index] = {
        ...step,
        ...param.partial,
        param: {
          ...step.param,
          ...param.partial.param,
        } as PageAction.Parameter,
      }
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
    if (cmd == null || !isPageActionCommand(cmd)) {
      console.error('PageActionCommand is not valid')
      response(false)
      return
    }

    if (cmd.pageActionOption == null) {
      console.error('PageActionOption not found')
      response(false)
      return true
    }
    const steps = cmd.pageActionOption.steps

    // Run the steps on the popup.
    run({ ...param, tabId, steps }, sender, response)
  }
  open()
  return true
}

export const preview = (
  param: RunPageAction,
  sender: Sender,
  response: (res: unknown) => void,
): boolean => {
  const tabId = param.tabId || sender.tab?.id
  if (tabId == null) {
    console.error('tabId not found')
    response(false)
    return true
  }

  const func = async () => {
    const option = await Storage.get<PageActionRecordingData>(
      SESSION_STORAGE_KEY.PA_RECORDING,
    )

    // Reload tab if startUrl exists.
    if (isUrl(option.startUrl)) {
      await chrome.tabs.update(tabId, { url: option.startUrl })
    }

    run(param, sender, response)
  }

  func()
  return true
}

const run = (
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
    await RunningStatus.init(tabId, steps)
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
        await RunningStatus.update(
          step.id,
          EXEC_STATE.Doing,
          '',
          TIMEOUT + step.delayMs,
        )

        // Wait for the delay time
        if (step.delayMs > 0) {
          await sleep(step.delayMs)
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
          if (step.param.type === PAGE_ACTION_CONTROL.end) {
            // End of the action
            await RunningStatus.update(step.id, EXEC_STATE.Done, '', 500)
            break
          }
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

export const stopRunner = (
  _: any,
  __: Sender,
  response: (res: unknown) => void,
): boolean => {
  BgData.set((data) => ({ ...data, pageActionStop: true })).then(() => {
    response(true)
  })
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

let lastUrl: string | null = null
chrome.tabs.onUpdated.addListener(
  (id: number, info: chrome.tabs.TabChangeInfo) => {
    Storage.get<PageActionContext>(SESSION_STORAGE_KEY.PA_CONTEXT).then(
      (data) => {
        if (data.recordingTabId !== id) return
        if (!info.url || lastUrl === info.url) return
        Storage.update<PageActionContext>(
          SESSION_STORAGE_KEY.PA_CONTEXT,
          (data) => {
            return {
              ...data,
              urlChanged: true,
            }
          },
        )
        lastUrl = info.url
      },
    )
  },
)

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
