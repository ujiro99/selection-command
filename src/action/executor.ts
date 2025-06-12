import type { ExecuteCommandParams } from '@/types'
import { OPEN_MODE } from '@/const'
import { sendEvent, ANALYTICS_EVENTS } from '@/services/analytics'

export async function executeAction({
  actions,
  command,
  position,
  selectionText,
  target,
  useSecondary = false,
  useClipboard = false,
  changeState,
}: ExecuteCommandParams & { actions: Record<string, any> }) {
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
    useClipboard,
    changeState: changeState ?? (() => {}),
    target: target ?? null,
  })

  sendEvent(ANALYTICS_EVENTS.SELECTION_COMMAND, { id: mode })

  return res
}
