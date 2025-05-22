import { actions } from '@/action'
import type { ExecuteCommandParams } from '@/types'
import { OPEN_MODE } from '@/const'

export async function execute({
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
