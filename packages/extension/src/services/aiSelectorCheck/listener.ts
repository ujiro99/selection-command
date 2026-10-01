/**
 * Content script side of the developer AI selector check.
 * Answers TabCommand.checkAiSelectors sent from the options page.
 *
 * The check types a dummy text into the page, so the listener is registered
 * only while the developer tools are enabled (see devFlag.ts); regular users
 * never get it. Tabs opened by the check are created after the flag is
 * mirrored, so reading it once at startup is enough.
 */
import { Ipc, TabCommand } from "@/services/ipc"
import { isDevToolsEnabledForContentScript } from "./devFlag"
import { checkSelectorsInDocument, type CheckTarget } from "./domChecker"

export type CheckAiSelectorsParam = {
  target: CheckTarget
}

export const registerAiSelectorCheckListener = async (): Promise<void> => {
  // Only the top frame is checked; AI service composers live there.
  if (window.top !== window) return
  try {
    if (!(await isDevToolsEnabledForContentScript())) return
  } catch {
    return
  }
  Ipc.addListener<CheckAiSelectorsParam>(
    TabCommand.checkAiSelectors,
    (param, _sender, response) => {
      checkSelectorsInDocument(param.target).then(response)
      // Keep the message channel open for the async response.
      return true
    },
  )
}
