import type { ExecuteCommandParams } from "@/types"
import { OPEN_MODE } from "@/const"
import { sendEvent, ANALYTICS_EVENTS } from "@/services/analytics"
import { resolveCommandSource } from "@/services/commandSource"
import {
  dispatchCommandExecuted,
  isOnboardingPage,
} from "@/components/onboarding/onboardingEvents"

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

  // Don't send analytics events for commands executed from within the onboarding flow itself.
  if (!isOnboardingPage(pageUrl)) {
    sendEvent(ANALYTICS_EVENTS.SELECTION_COMMAND, {
      event_label: mode,
      command_id: command.id,
      source_type: sourceType,
      source_id: sourceId,
    })
  }

  dispatchCommandExecuted({ commandId: command.id, commandType: mode })

  return res
}
