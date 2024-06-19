import { OPEN_MODE } from '@/const'
import { Popup } from './popup'
import { Tab } from './tab'

export const actions = {
  [OPEN_MODE.POPUP]: Popup,
  [OPEN_MODE.TAB]: Tab,
  [OPEN_MODE.LINK_POPUP]: Popup,
}
