import { useEffect } from 'react'
import type { PageActiontStatus } from '@/types'
import {
  PageActionDispatcher as dispatcher,
  PageAction,
} from '@/services/pageAction'
import type { ExecPageAction } from '@/services/ipc'
import { Ipc, TabCommand } from '@/services/ipc'
import { debounceDOMChange } from '@/services/dom'
import { RunningStatus } from '@/services/pageAction'
import { usePageActionContext } from '@/hooks/pageAction/usePageActionContext'
import { PAGE_ACTION_CONTROL, PAGE_ACTION_EXEC_STATE } from '@/const'

const STOP_STATUS = [
  PAGE_ACTION_EXEC_STATE.Done,
  PAGE_ACTION_EXEC_STATE.Failed,
  PAGE_ACTION_EXEC_STATE.Stop,
]

export function usePageActionRunner() {
  const { setContextData } = usePageActionContext()

  useEffect(() => {
    const listener = (param: any, _sender: any, response: any) => {
      execute(param).then((result) => {
        response(result)
      })
      return true
    }

    let timeout = 0
    const updateStatus = (status: PageActiontStatus) => {
      clearTimeout(timeout)
      const sid = status.stepId
      const step = status.results?.find((s) => s.stepId === sid)
      if (!step) return
      if (step.status === PAGE_ACTION_EXEC_STATE.Start) {
        setContextData({ isRunning: true })
      } else if (STOP_STATUS.includes(step.status)) {
        timeout = window.setTimeout(() => {
          setContextData({ isRunning: false })
        }, 500)
      }
    }

    RunningStatus.get().then(updateStatus)
    RunningStatus.subscribe(updateStatus)
    Ipc.addListener(TabCommand.execPageAction, listener)
    return () => {
      RunningStatus.unsubscribe(updateStatus)
      Ipc.removeListener(TabCommand.execPageAction)
    }
  }, [])

  const execute = async (
    message: ExecPageAction.Message,
  ): Promise<ExecPageAction.Return> => {
    const { step, srcUrl, selectedText, clipboardText } = message
    const type = step.param.type

    // Wait for the DOM to be updated.
    if (type !== PAGE_ACTION_CONTROL.end) {
      await debounceDOMChange(type)
    }

    let result = false
    let msg: string | undefined
    try {
      switch (type) {
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
          } as PageAction.InputExec)
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
          console.warn(`Unknown action type: ${type}`)
          break
      }
    } catch (e) {
      console.error(e)
      msg = `${e}`
    }
    return { result, message: msg }
  }
}
