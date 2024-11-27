import { useEffect, useState } from 'react'
import { Ipc, TabCommand } from '@/services/ipc'
import type { ClickElementProps, Message } from '@/services/ipc'

export function useTabCommandReceiver() {
  const [tabId, setTabId] = useState<number | null>(null)

  useEffect(() => {
    Ipc.send(TabCommand.getTabId).then((id) => {
      console.log('getTabId', id)
      setTabId(id)
    })
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
    console.debug('execute', message.command)
    switch (message.command) {
      case TabCommand.clickElement:
        clickElement(message.param as ClickElementProps)
        break
    }
  }
}
