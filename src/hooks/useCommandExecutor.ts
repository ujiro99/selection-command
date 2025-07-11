import { useState } from "react"
import { ExecState } from "@/const"
import type { Command, SelectionCommand } from "@/types"
import { execute } from "@/action"

type ItemState = {
  state: ExecState
  message?: string
}

type ExecuteCommandParams = {
  command: Command | SelectionCommand
  position: { x: number; y: number }
  selectionText: string
  target: Element | null
  useSecondary?: boolean
  useClipboard?: boolean
}

export function useCommandExecutor() {
  const [itemState, setItemState] = useState<ItemState>({
    state: ExecState.NONE,
  })
  const [result, setResult] = useState<React.ReactNode>()

  const onChangeState = (state: ExecState, message?: string) => {
    setItemState({ state, message })
  }

  const executeCommandWithState = async ({
    command,
    position,
    selectionText,
    target,
    useSecondary = false,
    useClipboard = false,
  }: ExecuteCommandParams) => {
    if (itemState.state !== ExecState.NONE) {
      return
    }

    const res = await execute({
      command,
      position,
      selectionText,
      target,
      useSecondary,
      useClipboard,
      changeState: onChangeState,
    })

    if (res) {
      setResult(res)
    }
  }

  const clearResult = () => {
    setResult(undefined)
  }

  return {
    itemState,
    result,
    executeCommand: executeCommandWithState,
    clearResult,
  }
}
