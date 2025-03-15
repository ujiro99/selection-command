import { useEffect, useState } from 'react'
import { Ipc, TabCommand } from '@/services/ipc'
import type {
  ClickElementProps,
  RunPageActionProps,
  Message,
} from '@/services/ipc'
import { usePageActionRunner } from '@/hooks/pageAction/usePageActionRunner'
import { usePageActionContext } from '@/hooks/pageAction/usePageActionContext'

const COMMANDS = [TabCommand.clickElement, TabCommand.runPageAction]

export function useTabCommandReceiver() {
  const [tabId, setTabId] = useState<number | null>(null)
  const Runner = usePageActionRunner()
  const { setContextData } = usePageActionContext()

  useEffect(() => {
    Ipc.getTabId().then(setTabId)
  }, [])

  useEffect(() => {
    const start = async () => {
      if (tabId == null) return
      let msg
      do {
        msg = await Ipc.recvQueue(tabId, COMMANDS)
        msg && (await execute(msg))
      } while (msg)

      Ipc.addQueueChangedListener(tabId, COMMANDS, execute)
      return () => {
        Ipc.removeQueueChangedLisner(tabId, COMMANDS)
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
      case TabCommand.runPageAction:
        const props = message.param as RunPageActionProps
        console.log('runPageAction', props)
        // Set context of PageAction
        await setContextData({
          runnerId: Runner.id,
          selectedText: props.selectedText,
          clipboardText: props.clipboardText,
        })
        await Runner.run(props.steps)
        break
    }
  }
}
