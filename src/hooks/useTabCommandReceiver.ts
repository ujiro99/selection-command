import { useEffect, useState } from 'react'
import { Ipc, TabCommand } from '@/services/ipc'
import type { ClickElementProps, Message } from '@/services/ipc'

export function useTabCommandReceiver() {
  const [tabId, setTabId] = useState<number | null>(null)

  useEffect(() => {
    Ipc.getTabId().then(setTabId)
  }, [])

  useEffect(() => {
    ;(async () => {
      if (tabId == null) return
      const msgs = await Ipc.recvQueue(tabId)
      msgs.forEach((m) => execute(m))
      Ipc.addQueueListener(tabId, execute)
      return () => {
        Ipc.removeQueueListener(tabId)
      }
    })()
  }, [tabId])

  const clickElement = (param: ClickElementProps) => {
    const element = document.querySelector(param.selector) as HTMLElement
    if (element) {
      element.click()
    }
    return false
  }

  const execute = (message: Message) => {
    switch (message.command) {
      case TabCommand.clickElement:
        console.debug('clickElement', message.command)
        clickElement(message.param as ClickElementProps)
        break
    }
  }
}
