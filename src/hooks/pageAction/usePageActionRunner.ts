import { useEffect, useState, useRef } from 'react'
import {
  PageActionDispatcher as dispatcher,
  PageActionProps,
} from '@/services/pageAction'
import type { Message } from '@/services/ipc'
import { Ipc, BgCommand, TabCommand } from '@/services/ipc'
import { PageActionType } from '@/types'
import { usePageActionContext } from '@/hooks/pageAction/usePageActionContext'

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
  const tabId = useRef<number | null>(null)
  const setTabId = (id: number) => (tabId.current = id)
  const stopPreview = useRef<boolean | null>(false)
  const setStopPreview = (s: boolean) => (stopPreview.current = s)
  const [isExecuting, setIsExecuting] = useState(false)
  const [isQueueEmpty, setIsQueueEmpty] = useState(true)
  const { selectedText, clipboardText } = usePageActionContext()
  const isRunning = !isQueueEmpty || isExecuting

  console.log('selected', selectedText, 'clipboard', clipboardText)

  useEffect(() => {
    Ipc.getTabId().then(setTabId)

    const log = (e: CustomEvent) => {
      console.log(e.type, e.detail.type, e.detail.id)
    }
    window.addEventListener(RunnerEvent.Start, log as any)
    window.addEventListener(RunnerEvent.Done, log as any)
    window.addEventListener(RunnerEvent.Failed, log as any)
    return () => {
      window.removeEventListener(RunnerEvent.Start, log as any)
      window.removeEventListener(RunnerEvent.Done, log as any)
      window.removeEventListener(RunnerEvent.Failed, log as any)
    }
  }, [])

  useEffect(() => {
    if (tabId.current == null) return
    const queueChanged = () => {
      Ipc.isQueueEmpty(tabId.current!, TabCommand.executePageAction).then(
        setIsQueueEmpty,
      )
    }
    Ipc.addQueueChangedListener(
      tabId.current,
      TabCommand.executePageAction,
      queueChanged,
    )
    // Resume execution if the queue is not empty.
    executeAll()
    return () => {
      Ipc.removeQueueChangedLisner(tabId.current!, TabCommand.executePageAction)
    }
  }, [tabId.current])

  const execute = async (message: Message) => {
    if (message.command !== TabCommand.executePageAction) return
    const action = message.param as PageActionType
    const eventParam = { detail: { id: action.id, type: action.type } } as const
    window.dispatchEvent(new CustomEvent(RunnerEvent.Start, eventParam))
    setIsExecuting(true)
    let result = false
    let msg: string | undefined
    try {
      switch (action.type) {
        case 'start':
          const url = action.params.url as string
          if (url) {
            location.href = url
            // Resume until the page is loaded.
            setStopPreview(true)
          }
          result = true
          break
        case 'click':
          ;[result, msg] = await dispatcher.click(
            action.params as PageActionProps.Click,
          )
          break
        case 'doubleClick':
          ;[result, msg] = await dispatcher.doubleCilck(
            action.params as PageActionProps.Click,
          )
          break
        case 'tripleClick':
          ;[result, msg] = await dispatcher.tripleClick(
            action.params as PageActionProps.Click,
          )
          break
        case 'keyboard':
          ;[result, msg] = await dispatcher.keyboard(
            action.params as PageActionProps.Keyboard,
          )
          break
        case 'input':
          ;[result, msg] = await dispatcher.input({
            ...action.params,
            selectedText,
            clipboardText,
          } as PageActionProps.Input)
          break
        case 'scroll':
          ;[result, msg] = await dispatcher.scroll(
            action.params as PageActionProps.Scroll,
          )
          break
        case 'end':
          result = true
          break
        default:
          console.warn(`Unknown action type: ${action.type}`)
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

  const executeAll = async () => {
    console.log('executeAll')
    if (tabId.current == null) return
    let msg
    do {
      msg = await Ipc.recvQueue(tabId.current, TabCommand.executePageAction)
      msg && (await execute(msg))
    } while (msg && !stopPreview.current)
  }

  const start = async () => {
    if (tabId.current == null) return
    setStopPreview(false)
    await Ipc.send(BgCommand.queuePageAction)
    await executeAll()
  }

  const stop = async () => {
    if (tabId.current == null) return
    setStopPreview(true)
    return await Ipc.removeQueue(tabId.current, TabCommand.executePageAction)
  }

  const subscribe = (event: RunnerEvent, func: ExecutinListener) => {
    window.addEventListener(event, func as any)
  }

  const unsubscribe = (event: RunnerEvent, func: ExecutinListener) => {
    window.removeEventListener(event, func as any)
  }

  return { start, stop, isRunning, subscribe, unsubscribe }
}
