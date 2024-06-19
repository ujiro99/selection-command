import { OPEN_MODE } from '@/const'
import { Popup } from './popup'

export const actions = {
  [OPEN_MODE.POPUP]: Popup,
  [OPEN_MODE.LINK_POPUP]: Popup,
}
