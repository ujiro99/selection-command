import { useEffect, useState } from 'react'
import { Ipc, TabCommand } from '@/services/ipc'
import type { ClickElementProps, Message } from '@/services/ipc'

export function useTabCommandReceiver() {
  const [tabId, setTabId] = useState<number | null>(null)

  useEffect(() => {
    Ipc.getTabId().then(setTabId)
  }, [])

  useEffect(() => {
    const start = async () => {
      if (tabId == null) return
      let msg
      do {
        msg = await Ipc.recvQueue(tabId, TabCommand.clickElement)
        msg && (await execute(msg))
      } while (msg)

      Ipc.addQueueChangedListener(tabId, TabCommand.clickElement, execute)
      return () => {
        Ipc.removeQueueChangedLisner(tabId, TabCommand.clickElement)
      }
    }
    start()
  }, [tabId])

  const clickElement = (param: ClickElementProps) => {
    const element = document.querySelector(param.selector) as HTMLElement
    if (element) {
      element.click()
    }
    return false
  }

  const execute = async (message: Message | null) => {
    if (!message) return
    console.debug(message.command, message.param)
    switch (message.command) {
      case TabCommand.clickElement:
        clickElement(message.param as ClickElementProps)
        break
    }
  }
}
