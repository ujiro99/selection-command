import { Ipc, BgCommand } from '@/services/ipc'
import { isValidString } from '@/lib/utils'
import { getScreenSize, getWindowPosition } from '@/services/screen'
import { OpenPopupProps } from '@/services/chrome'
import { POPUP_TYPE, SPACE_ENCODING } from '@/const'
import { PopupOption } from '@/services/defaultSettings'
import type { ExecuteCommandParams } from '@/types'

export const Popup = {
  async execute({
    selectionText,
    command,
    position,
    useClipboard,
  }: ExecuteCommandParams) {
    if (!isValidString(command.searchUrl)) {
      console.error('searchUrl is not valid.')
      return
    }
    if (position === null) {
      console.error('position is null.')
      return
    }

    const windowPosition = await getWindowPosition()
    const screen = await getScreenSize()

    Ipc.send<OpenPopupProps>(BgCommand.openPopup, {
      commandId: command.id,
      searchUrl: command.searchUrl,
      spaceEncoding: command.spaceEncoding ?? SPACE_ENCODING.PLUS,
      selectionText,
      useClipboard: useClipboard ?? false,
      top: Math.floor(windowPosition.top + position.y),
      left: Math.floor(windowPosition.left + position.x),
      height: command.popupOption?.height ?? PopupOption.height,
      width: command.popupOption?.width ?? PopupOption.width,
      screen,
      type: POPUP_TYPE.POPUP,
    })
  },
}
