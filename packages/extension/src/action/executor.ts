import type { ExecuteCommandParams } from "@/types"
import { OPEN_MODE, getCommandAnalyticsCategory } from "@/const"
import { sendEvent, getSelectionCommandEvent } from "@/services/analytics"
import { resolveCommandSource } from "@/services/commandSource"

export async function executeAction({
  actions,
  command,
  position,
  selectionText,
  target,
  useSecondary = false,
  useClipboard = false,
  changeState,
  pageUrl,
}: ExecuteCommandParams & { actions: Record<string, any> }) {
  let mode = command.openMode as OPEN_MODE
  if (
    useSecondary &&
    "openModeSecondary" in command &&
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
    pageUrl,
  })

  const { sourceType, sourceId } = resolveCommandSource(command)

  sendEvent(getSelectionCommandEvent(getCommandAnalyticsCategory(mode)), {
    event_label: mode,
    command_id: command.id,
    source_type: sourceType,
    source_id: sourceId,
  })

  return res
}
