import { OPEN_MODE_SERVICE_WORKER } from "@/const"
import { Popup } from "./popup"
import { Window } from "./window"
import { Tab } from "./tab"
import { BackgroundTab } from "./backgroundTab"
import { Api } from "./api"
import { PageAction } from "./pageAction"
import { AiPrompt } from "./aiPrompt"
import { executeAction } from "./executor"
import type { ExecuteCommandParams } from "@/types"

const actionsForServiceWorker = {
  [OPEN_MODE_SERVICE_WORKER.POPUP]: Popup,
  [OPEN_MODE_SERVICE_WORKER.WINDOW]: Window,
  [OPEN_MODE_SERVICE_WORKER.TAB]: Tab,
  [OPEN_MODE_SERVICE_WORKER.BACKGROUND_TAB]: BackgroundTab,
  [OPEN_MODE_SERVICE_WORKER.API]: Api,
  [OPEN_MODE_SERVICE_WORKER.PAGE_ACTION]: PageAction,
  [OPEN_MODE_SERVICE_WORKER.AI_PROMPT]: AiPrompt,
}

export async function execute({
  command,
  position,
  selectionText,
  target,
  useSecondary = false,
  allowClipboardFallback = false,
  changeState,
  pageUrl,
}: ExecuteCommandParams) {
  return executeAction({
    command,
    position,
    selectionText,
    target,
    useSecondary,
    allowClipboardFallback,
    changeState,
    pageUrl,
    actions: actionsForServiceWorker,
  })
}
