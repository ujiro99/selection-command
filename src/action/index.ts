import { OPEN_MODE } from '@/const'
import { Popup } from './popup'
import { Tab } from './tab'
import { Api } from './api'
import { LinkPopup } from './linkPopup'
import { Copy } from './copy'
import { Option } from './option'
import { GetStyles as GetTextStyles } from './getStyles'
import { AddPageRule } from './addPageRule'
import type { Command } from '@/types'

export enum ExecState {
  NONE = 0,
  EXECUTING = 1,
  SUCCESS = 2,
  FAIL = 3,
}

export interface ExecProps {
  selectionText: string
  command: Command
  menuElm: Element | null
  target: Element | undefined
  useSecondary: boolean
  changeState: (state: ExecState, message?: string) => void
}

export const actions = {
  [OPEN_MODE.POPUP]: Popup,
  [OPEN_MODE.TAB]: Tab,
  [OPEN_MODE.API]: Api,
  [OPEN_MODE.LINK_POPUP]: LinkPopup,
  [OPEN_MODE.COPY]: Copy,
  [OPEN_MODE.GET_TEXT_STYLES]: GetTextStyles,
  [OPEN_MODE.OPTION]: Option,
  [OPEN_MODE.ADD_PAGE_RULE]: AddPageRule,
}
