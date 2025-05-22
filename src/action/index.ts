import { OPEN_MODE } from '@/const'
import { Popup } from './popup'
import { Window } from './window'
import { Tab } from './tab'
import { Api } from './api'
import { SelectedLinkPopup } from './selectedLinkPopup'
import { Copy } from './copy'
import { PageAction } from './pageAction'
import { Option } from './option'
import { GetStyles as GetTextStyles } from './getStyles'
import { AddPageRule } from './addPageRule'
import { executeAction } from './executor'
import type { ExecuteCommandParams } from '@/types'

export const actions = {
  [OPEN_MODE.POPUP]: Popup,
  [OPEN_MODE.WINDOW]: Window,
  [OPEN_MODE.TAB]: Tab,
  [OPEN_MODE.API]: Api,
  [OPEN_MODE.LINK_POPUP]: SelectedLinkPopup,
  [OPEN_MODE.COPY]: Copy,
  [OPEN_MODE.PAGE_ACTION]: PageAction,
  [OPEN_MODE.GET_TEXT_STYLES]: GetTextStyles,
  [OPEN_MODE.OPTION]: Option,
  [OPEN_MODE.ADD_PAGE_RULE]: AddPageRule,
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
    actions,
  })
}
