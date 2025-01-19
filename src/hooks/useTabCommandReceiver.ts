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

      let msg
      do {
        msg = await Ipc.recvQueue(tabId, TabCommand.clickElement)
        msg && execute(msg)
      } while (msg)

      Ipc.addQueueChangedListener(tabId, TabCommand.clickElement, execute)
      return () => {
        Ipc.removeQueueChangedLisner(tabId, TabCommand.clickElement)
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

  const execute = (message: Message | null) => {
    if (!message) return
    switch (message.command) {
      case TabCommand.clickElement:
        console.debug('clickElement', message.command)
        clickElement(message.param as ClickElementProps)
        break
    }
  }
}
