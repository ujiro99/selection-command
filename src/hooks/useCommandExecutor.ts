import { useState } from 'react'
import { actions, ExecState } from '@/action'
import type { Command, SelectionCommand } from '@/types'
import { OPEN_MODE } from '@/const'

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
}

export function useCommandExecutor() {
  const [itemState, setItemState] = useState<ItemState>({
    state: ExecState.NONE,
  })
  const [result, setResult] = useState<React.ReactNode>()

  const onChangeState = (state: ExecState, message?: string) => {
    setItemState({ state, message })
  }

  const executeCommand = async ({
    command,
    position,
    selectionText,
    target,
    useSecondary = false,
  }: ExecuteCommandParams) => {
    if (itemState.state !== ExecState.NONE) {
      return
    }

    let mode = command.openMode as OPEN_MODE
    if (
      useSecondary &&
      'openModeSecondary' in command &&
      command.openModeSecondary
    ) {
      mode = command.openModeSecondary
    }

    const res = await actions[mode].execute({
      selectionText,
      command,
      position,
      useSecondary,
      changeState: onChangeState,
      target,
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
    executeCommand,
    clearResult,
  }
}
