import { OPEN_MODE_BG } from '@/const'
import { Popup } from './popup'
import { Window } from './window'
import { Tab } from './tab'
import { Api } from './api'
import { PageAction } from './pageAction'
import type { ExecuteCommandParams } from '@/types'
import { executeAction } from './executor'

export const actionsForBackground = {
  [OPEN_MODE_BG.POPUP]: Popup,
  [OPEN_MODE_BG.WINDOW]: Window,
  [OPEN_MODE_BG.TAB]: Tab,
  [OPEN_MODE_BG.API]: Api,
  [OPEN_MODE_BG.PAGE_ACTION]: PageAction,
}

export async function execute({
  command,
  position,
  selectionText,
  target,
  useSecondary = false,
  changeState,
}: ExecuteCommandParams) {
  return executeAction({
    command,
    position,
    selectionText,
    target,
    useSecondary,
    changeState,
    actions: actionsForBackground,
  })
}
