import { useEffect, useState, useRef, useId } from 'react'
import { usePageActionContext } from '@/hooks/pageAction/usePageActionContext'
import {
  PageActionDispatcher as dispatcher,
  PageAction,
} from '@/services/pageAction'
import type { Message } from '@/services/ipc'
import { Ipc, BgCommand, TabCommand } from '@/services/ipc'
import { debounceDOMChange } from '@/services/dom'
import { PageActionStep } from '@/types'
import { PAGE_ACTION_CONTROL } from '@/const'

type ExecutinListenerParam = {
  detail: { id: string; type: string; message: string }
}

type ExecutinListener = (event: ExecutinListenerParam) => void

export enum RunnerEvent {
  Start = 'Start',
  Done = 'Done',
  Failed = 'Failed',
}

export function usePageActionRunner() {
  const thisId = useId()
  const tabId = useRef<number | null>(null)
  const executing = useRef<boolean | null>(false)
  const stopExecute = useRef<boolean | null>(false)
  const setStopExecute = (s: boolean) => (stopExecute.current = s)
  const [isExecuting, setIsExecuting] = useState(false)
  const [isQueueEmpty, setIsQueueEmpty] = useState(true)
  const { runnerId, srcUrl, selectedText, clipboardText } =
    usePageActionContext()
  const isRunner = runnerId === thisId
  const isRunning = !isQueueEmpty || isExecuting

  useEffect(() => {
    const setTabId = (id: number) => (tabId.current = id)
    Ipc.getTabId().then(setTabId)
  }, [])

  useEffect(() => {
    const log = (e: CustomEvent) => {
      console.log(e.detail.runnerId, e.type, e.detail.type, e.detail.param)
    }
    if (isRunner) {
      window.addEventListener(RunnerEvent.Start, log as any)
      window.addEventListener(RunnerEvent.Done, log as any)
      window.addEventListener(RunnerEvent.Failed, log as any)
    }
    return () => {
      window.removeEventListener(RunnerEvent.Start, log as any)
      window.removeEventListener(RunnerEvent.Done, log as any)
      window.removeEventListener(RunnerEvent.Failed, log as any)
    }
  }, [isRunner])

  useEffect(() => {
    if (tabId.current == null) return
    if (!isRunner) return
    const queueChanged = () => {
      Ipc.isQueueEmpty(tabId.current!, TabCommand.execPageAction).then(
        (ret) => {
          setIsQueueEmpty(ret)
          !ret && executeQueue()
        },
      )
    }
    Ipc.addQueueChangedListener(
      tabId.current,
      TabCommand.execPageAction,
      queueChanged,
    )
    return () => {
      Ipc.removeQueueChangedLisner(tabId.current!, TabCommand.execPageAction)
    }
  }, [tabId.current, isRunner, srcUrl, selectedText, clipboardText])

  const execute = async (message: Message) => {
    if (message.command !== TabCommand.execPageAction) return
    const step = message.param as PageActionStep
    const eventParam = { detail: { runnerId, ...step } } as const
    window.dispatchEvent(new CustomEvent(RunnerEvent.Start, eventParam))
    setIsExecuting(true)

    // Wait for the DOM to be updated.
    if (step.type !== PAGE_ACTION_CONTROL.end) {
      await debounceDOMChange(step.type)
    }

    let result = false
    let msg: string | undefined
    try {
      switch (step.type) {
        case 'start':
          result = true
          break
        case 'click':
          ;[result, msg] = await dispatcher.click(
            step.param as PageAction.Click,
          )
          break
        case 'doubleClick':
          ;[result, msg] = await dispatcher.doubleCilck(
            step.param as PageAction.Click,
          )
          break
        case 'tripleClick':
          ;[result, msg] = await dispatcher.tripleClick(
            step.param as PageAction.Click,
          )
          break
        case 'keyboard':
          ;[result, msg] = await dispatcher.keyboard(
            step.param as PageAction.Keyboard,
          )
          break
        case 'input':
          ;[result, msg] = await dispatcher.input({
            ...step.param,
            srcUrl,
            selectedText,
            clipboardText,
          } as PageAction.Input)
          break
        case 'scroll':
          ;[result, msg] = await dispatcher.scroll(
            step.param as PageAction.Scroll,
          )
          break
        case 'end':
          result = true
          break
        default:
          console.warn(`Unknown action type: ${step.type}`)
          window.dispatchEvent(
            new CustomEvent(RunnerEvent.Failed, {
              detail: { ...eventParam.detail, message: 'Unknown action type' },
            }),
          )
      }
    } catch (e) {
      console.error(e)
    }
    window.dispatchEvent(
      new CustomEvent(result ? RunnerEvent.Done : RunnerEvent.Failed, {
        detail: { ...eventParam.detail, message: msg },
      }),
    )
    setIsExecuting(false)
  }

  const executeQueue = async () => {
    if (tabId.current == null) return
    if (executing.current) return console.log('executeQueue cancel')
    executing.current = true
    let msg
    do {
      msg = await Ipc.recvQueue(tabId.current, TabCommand.execPageAction)
      msg && (await execute(msg))
    } while (msg && !stopExecute.current)
    executing.current = false
  }

  const run = async (steps: PageActionStep[]) => {
    if (tabId.current == null) return
    setStopExecute(false)
    await Ipc.send(BgCommand.queuePageAction, {
      steps,
    })
  }

  const stop = async () => {
    if (tabId.current == null) return
    setStopExecute(true)
    return await Ipc.removeQueue(tabId.current, TabCommand.execPageAction)
  }

  const subscribe = (event: RunnerEvent, func: ExecutinListener) => {
    window.addEventListener(event, func as any)
  }

  const unsubscribe = (event: RunnerEvent, func: ExecutinListener) => {
    window.removeEventListener(event, func as any)
  }

  return { id: thisId, run, stop, isRunning, subscribe, unsubscribe }
}
