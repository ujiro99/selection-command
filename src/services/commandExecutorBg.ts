import { actionsForBackground, ExecState } from '@/action/background'
import type { Command, SelectionCommand } from '@/types'
import { OPEN_MODE_BG } from '@/const'

type ExecuteCommandParams = {
  command: Command | SelectionCommand
  position: { x: number; y: number } | null
  selectionText: string
  target?: Element | null
  useSecondary?: boolean
  changeState?: (state: ExecState, message?: string) => void
}

export async function executeCommandForBg({
  command,
  position,
  selectionText,
  target,
  useSecondary = false,
  changeState,
}: ExecuteCommandParams) {
  let mode = command.openMode as unknown as OPEN_MODE_BG
  if (
    useSecondary &&
    'openModeSecondary' in command &&
    command.openModeSecondary
  ) {
    mode = command.openModeSecondary as unknown as OPEN_MODE_BG
  }

  let action = actionsForBackground[mode]
  if (!action) {
    console.error(`Action for mode ${mode} not found`)
    return
  }

  const res = await action.execute({
    selectionText,
    command,
    position,
    useSecondary,
    changeState: changeState ?? (() => {}),
    target: target ?? null,
  })

  return res
}
