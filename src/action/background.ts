import { OPEN_MODE_BG } from '@/const'
import { Popup } from './popup'
import { Window } from './window'
import { Tab } from './tab'
// import { Api } from './api'
import { PageAction } from './pageAction'
import type { Command, Point } from '@/types'

export enum ExecState {
  NONE = 0,
  EXECUTING = 1,
  SUCCESS = 2,
  FAIL = 3,
}

export interface ExecProps {
  selectionText: string
  command: Command
  position: Point | null
  target: Element | null
  useSecondary: boolean
  changeState: (state: ExecState, message?: string) => void
}

export const actionsForBackground = {
  [OPEN_MODE_BG.POPUP]: Popup,
  [OPEN_MODE_BG.WINDOW]: Window,
  [OPEN_MODE_BG.TAB]: Tab,
  // [OPEN_MODE.API]: Api,
  [OPEN_MODE_BG.PAGE_ACTION]: PageAction,
}
