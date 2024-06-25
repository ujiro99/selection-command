import { Ipc, BgCommand } from '@/services/ipc'
import { getSceenSize, toUrl } from '@/services/util'
import type { ExecProps } from './index'

export const Popup = {
  execute({ selectionText, command, menuElm }: ExecProps) {
    if (menuElm) {
      const urls = [
        toUrl(command.searchUrl, selectionText, command.spaceEncoding),
      ]
      const rect = menuElm.getBoundingClientRect()
      console.debug('open popup', rect)
      Ipc.send(BgCommand.openPopups, {
        commandId: command.id,
        urls: urls,
        top: Math.floor(window.screenTop + rect.top),
        left: Math.floor(window.screenLeft + rect.left + 20),
        height: command.popupOption?.height,
        width: command.popupOption?.width,
        screen: getSceenSize(),
      })
    }
  },
}
