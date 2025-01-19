import { useEffect, useState } from 'react'
import {
  PageActionDispatcher as dispatcher,
  PageActionProps,
} from '@/services/pageAction'
import type { Message } from '@/services/ipc'
import { Ipc, BgCommand, TabCommand } from '@/services/ipc'
import { PageActionType } from '@/types'

type OnExecuted = (id: string) => void
const listeners: OnExecuted[] = []

export function usePageActionRunner() {
  const [tabId, setTabId] = useState<number | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [isQueueEmpty, setIsQueueEmpty] = useState(true)
  const isRunning = !isQueueEmpty || isExecuting

  useEffect(() => {
    Ipc.getTabId().then(setTabId)
  }, [])

  useEffect(() => {
    if (tabId == null) return
    const queueChanged = () => {
      Ipc.isQueueEmpty(tabId, TabCommand.executePageAction).then(
        setIsQueueEmpty,
      )
    }
    Ipc.addQueueChangedListener(
      tabId,
      TabCommand.executePageAction,
      queueChanged,
    )
    return () => {
      Ipc.removeQueueChangedLisner(tabId, TabCommand.executePageAction)
    }
  }, [tabId])

  const execute = async (message: Message) => {
    if (message.command !== TabCommand.executePageAction) return
    setIsExecuting(true)
    const action = message.param as PageActionType
    console.debug('Run action:', action.type, action.params)
    try {
      switch (action.type) {
        case 'click':
          await dispatcher.click(action.params as PageActionProps.Click)
          break
        case 'keyboard':
          await dispatcher.keyboard(action.params as PageActionProps.Keyboard)
          break
        case 'input':
          await dispatcher.input(action.params as PageActionProps.Input)
          break
        case 'scroll':
          await dispatcher.scroll(action.params as PageActionProps.Scroll)
          break
        default:
          console.warn(`Unknown action type: ${action.type}`)
      }
    } catch (e) {
      console.error(e)
    }
    listeners.forEach((f) => f(action.id))
    setIsExecuting(false)
    console.debug('Run complete:', action.type)
  }

  const start = async () => {
    if (tabId == null) return
    await Ipc.send(BgCommand.queuePageAction)
    let msg
    do {
      msg = await Ipc.recvQueue(tabId, TabCommand.executePageAction)
      msg && (await execute(msg))
    } while (msg)
  }

  const stop = async () => {
    return await Ipc.removeQueue(tabId!, TabCommand.executePageAction)
  }

  const event = {
    addOnExecutedListener: (onExecuted: OnExecuted) => {
      listeners.push(onExecuted)
    },
    removeOnExecutedListener: (onExecuted: OnExecuted) => {
      const index = listeners.indexOf(onExecuted)
      if (index >= 0) {
        listeners.splice(index, 1)
      }
    },
  }

  return { start, stop, isRunning, event }
}
