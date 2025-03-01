import { Ipc, BgCommand } from '@/services/ipc'
import { toUrl, isValidString } from '@/lib/utils'
import { getScreenSize } from '@/services/dom'
import { POPUP_TYPE } from '@/const'
import type { ExecProps } from './index'

export const Popup = {
  async execute({ selectionText, command, position }: ExecProps) {
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

    Ipc.send(BgCommand.openPopups, {
      commandId: command.id,
      urls: urls,
      top: Math.floor(window.screenTop + position.y),
      left: Math.floor(window.screenLeft + position.x),
      height: command.popupOption?.height,
      width: command.popupOption?.width,
      screen: getScreenSize(),
      type: POPUP_TYPE.POPUP,
    })
  },
}
