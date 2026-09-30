/**
 * Content script side of the developer AI selector check.
 * Answers TabCommand.checkAiSelectors sent from the options page.
 */
import { Ipc, TabCommand } from "@/services/ipc"
import { checkSelectorsInDocument, type CheckTarget } from "./domChecker"

export type CheckAiSelectorsParam = {
  target: CheckTarget
}

// Only the top frame is checked; AI service composers live there.
if (window.top === window) {
  Ipc.addListener<CheckAiSelectorsParam>(
    TabCommand.checkAiSelectors,
    (param, _sender, response) => {
      checkSelectorsInDocument(param.target).then(response)
      // Keep the message channel open for the async response.
      return true
    },
  )
}
