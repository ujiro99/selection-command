import { useEffect } from 'react'
import {
  PageActionDispatcher as dispatcher,
  PageAction,
} from '@/services/pageAction'
import type { ExecPageAction } from '@/services/ipc'
import { Ipc, TabCommand } from '@/services/ipc'
import { debounceDOMChange } from '@/services/dom'
import { usePageActionContext } from '@/hooks/pageAction/usePageActionContext'
import { PAGE_ACTION_CONTROL } from '@/const'

export function usePageActionRunner() {
  const { setContextData } = usePageActionContext()

  useEffect(() => {
    const listener = (param: any, _sender: any, response: any) => {
      execute(param).then((result) => {
        response(result)
      })
      return true
    }

    Ipc.addListener(TabCommand.execPageAction, listener)
    return () => {
      Ipc.removeListener(TabCommand.execPageAction)
    }
  }, [])

  const execute = async (
    message: ExecPageAction.Message,
  ): Promise<ExecPageAction.Return> => {
    setContextData({ isRunning: true })

    const { step, srcUrl, selectedText, clipboardText } = message

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
          break
      }
    } catch (e) {
      console.error(e)
      msg = `${e}`
    }
    setContextData({ isRunning: false })
    return { result, message: msg }
  }
}
