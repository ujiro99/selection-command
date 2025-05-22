import { Ipc, BgCommand } from '@/services/ipc'
import { toUrl, isValidString } from '@/lib/utils'
import { getScreenSize, getWindowPosition } from '@/services/screen'
import { POPUP_TYPE } from '@/const'
import type { ExecuteCommandParams } from '@/types'

export const Window = {
  async execute({ selectionText, command, position }: ExecuteCommandParams) {
    if (!isValidString(command.searchUrl)) {
      console.error('searchUrl is not valid.')
      return
    }
    if (position === null) {
      console.error('position is null.')
      return
    }

    const urls = [
      toUrl(command.searchUrl, selectionText, command.spaceEncoding),
    ]

    const windowPosition = await getWindowPosition()
    const screen = await getScreenSize()

    Ipc.send(BgCommand.openPopups, {
      commandId: command.id,
      urls: urls,
      top: Math.floor(windowPosition.top + position.y),
      left: Math.floor(windowPosition.left + position.x),
      height: command.popupOption?.height,
      width: command.popupOption?.width,
      screen,
      type: POPUP_TYPE.NORMAL,
    })
  },
}
