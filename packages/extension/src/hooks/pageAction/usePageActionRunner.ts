import { useEffect } from "react"
import {
  PageActionDispatcher,
  BackgroundPageActionDispatcher,
  PageAction,
} from "@/services/pageAction"
import type { ExecPageAction } from "@/services/ipc"
import { Ipc, TabCommand } from "@/services/ipc"
import { debounceDOMChange } from "@/services/dom"
import { usePageActionContext } from "@/hooks/pageAction/usePageActionContext"
import { PAGE_ACTION_CONTROL, PAGE_ACTION_OPEN_MODE } from "@/const"

export function usePageActionRunner() {
  const { setContextData, status } = usePageActionContext()

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

  useEffect(() => {
    if (status != null) {
      setContextData({ isRunning: true })
    } else {
      setContextData({ isRunning: false })
    }
  }, [setContextData, status])

  const execute = async (
    message: ExecPageAction.Message,
  ): Promise<ExecPageAction.Return> => {
    const {
      step,
      srcUrl,
      selectedText,
      clipboardText,
      openMode,
      userVariables,
    } = message
    const type = step.param.type

    // Select dispatcher based on openMode
    const dispatcher =
      openMode === PAGE_ACTION_OPEN_MODE.BACKGROUND_TAB
        ? BackgroundPageActionDispatcher
        : PageActionDispatcher

    // Wait for the DOM to be updated.
    if (type !== PAGE_ACTION_CONTROL.end) {
      await debounceDOMChange(type)
    }

    let result = false
    let msg: string | undefined
    try {
      switch (type) {
        case "start":
          result = true
          break
        case "click":
          ;[result, msg] = await dispatcher.click(
            step.param as PageAction.Click,
          )
          break
        case "doubleClick":
          ;[result, msg] = await dispatcher.doubleClick(
            step.param as PageAction.Click,
          )
          break
        case "tripleClick":
          ;[result, msg] = await dispatcher.tripleClick(
            step.param as PageAction.Click,
          )
          break
        case "keyboard":
          ;[result, msg] = await dispatcher.keyboard(
            step.param as PageAction.Keyboard,
          )
          break
        case "input":
          ;[result, msg] = await dispatcher.input({
            ...step.param,
            srcUrl,
            selectedText,
            clipboardText,
            userVariables,
          } as PageAction.InputExec)
          break
        case "scroll":
          ;[result, msg] = await dispatcher.scroll(
            step.param as PageAction.Scroll,
          )
          break
        case "end":
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
