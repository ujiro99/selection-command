import { Ipc, BgCommand } from '@/services/ipc'
import { toUrl } from '@/services/util'
import { getScreenSize } from '@/services/dom'
import { POPUP_TYPE } from '@/const'
import type { ExecProps } from './index'

export const Popup = {
  async execute({ selectionText, command, position }: ExecProps) {
    if (position) {
      const urls = [
        toUrl(command.searchUrl, selectionText, command.spaceEncoding),
      ]
      console.debug('open popup', position.x, position.y, urls)
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
    }
  },
}
