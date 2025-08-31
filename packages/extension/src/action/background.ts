import { OPEN_MODE_BG } from "@/const"
import { Popup } from "./popup"
import { Window } from "./window"
import { Tab } from "./tab"
import { BackgroundTab } from "./backgroundTab"
import { Api } from "./api"
import { PageAction } from "./pageAction"
import { executeAction } from "./executor"
import type { ExecuteCommandParams } from "@/types"

export const actionsForBackground = {
  [OPEN_MODE_BG.POPUP]: Popup,
  [OPEN_MODE_BG.WINDOW]: Window,
  [OPEN_MODE_BG.TAB]: Tab,
  [OPEN_MODE_BG.BACKGROUND_TAB]: BackgroundTab,
  [OPEN_MODE_BG.API]: Api,
  [OPEN_MODE_BG.PAGE_ACTION]: PageAction,
}

export async function execute({
  command,
  position,
  selectionText,
  target,
  useSecondary = false,
  useClipboard = false,
  changeState,
}: ExecuteCommandParams) {
  return executeAction({
    command,
    position,
    selectionText,
    target,
    useSecondary,
    useClipboard,
    changeState,
    actions: actionsForBackground,
  })
}
