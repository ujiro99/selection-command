import { actions, ExecState } from '@/action'
import type { Command, SelectionCommand } from '@/types'
import { OPEN_MODE } from '@/const'

type ExecuteCommandParams = {
  command: Command | SelectionCommand
  position: { x: number; y: number } | null
  selectionText: string
  target?: Element | null
  useSecondary?: boolean
  changeState?: (state: ExecState, message?: string) => void
}

export async function executeCommand({
  command,
  position,
  selectionText,
  target,
  useSecondary = false,
  changeState,
}: ExecuteCommandParams) {
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
    changeState: changeState ?? (() => {}),
    target: target ?? null,
  })

  return res
}
