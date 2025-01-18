import { useEffect, useState } from 'react'
import { PageAction, PageActionProps } from '@/services/pageAction'
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
      Ipc.isQueueEmpty(tabId).then(setIsQueueEmpty)
    }
    Ipc.addQueueListener(tabId, queueChanged)
    return () => {
      Ipc.removeQueueListener(tabId)
    }
  }, [tabId])

  useEffect(() => {
    if (!isExecuting) {
      recvAndExecute()
    }
  }, [tabId, isExecuting])

  const recvAndExecute = async () => {
    if (tabId == null) return
    const [msg] = await Ipc.recvQueue(tabId, true) // Recieve a single message.
    msg && execute(msg)
  }

  const execute = async (message: Message) => {
    if (message.command !== TabCommand.executePageAction) return
    setIsExecuting(true)
    const action = message.param as PageActionType
    console.debug('Run action:', action.type, action.params)
    try {
      switch (action.type) {
        case 'click':
          await PageAction.click(action.params as PageActionProps.Click)
          break
        case 'keyboard':
          PageAction.keyboard(action.params as PageActionProps.Keyboard)
          break
        case 'input':
          await PageAction.input(action.params as PageActionProps.Input)
          break
        case 'scroll':
          await PageAction.scroll(action.params as PageActionProps.Scroll)
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
    Ipc.send(BgCommand.queuePageAction)
    setIsExecuting(true)
    setTimeout(() => {
      setIsExecuting(false)
    }, 0)
  }

  const stop = async () => {
    return await Ipc.removeQueue(tabId!)
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
