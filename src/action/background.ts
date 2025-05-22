import { OPEN_MODE_BG } from '@/const'
import { Popup } from './popup'
import { Window } from './window'
import { Tab } from './tab'
// import { Api } from './api'
import { PageAction } from './pageAction'
import type { ExecuteCommandParams } from '@/types'

export enum ExecState {
  NONE = 0,
  EXECUTING = 1,
  SUCCESS = 2,
  FAIL = 3,
}

export const actionsForBackground = {
  [OPEN_MODE_BG.POPUP]: Popup,
  [OPEN_MODE_BG.WINDOW]: Window,
  [OPEN_MODE_BG.TAB]: Tab,
  // [OPEN_MODE.API]: Api,
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
  let mode = command.openMode as unknown as OPEN_MODE_BG
  if (
    useSecondary &&
    'openModeSecondary' in command &&
    command.openModeSecondary
  ) {
    mode = command.openModeSecondary as unknown as OPEN_MODE_BG
  }

  const res = await actionsForBackground[mode].execute({
    selectionText,
    command,
    position,
    useSecondary,
    changeState: changeState ?? (() => {}),
    target: target ?? null,
  })

  return res
}
