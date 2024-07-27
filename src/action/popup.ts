import { Ipc, BgCommand } from '@/services/ipc'
import { getScreenSize, toUrl } from '@/services/util'
import type { ExecProps } from './index'

export const Popup = {
  async execute({ selectionText, command, menuElm }: ExecProps) {
    if (menuElm) {
      const urls = [
        toUrl(command.searchUrl, selectionText, command.spaceEncoding),
      ]
      const rect = menuElm.getBoundingClientRect()
      console.debug('open popup', rect)
      Ipc.send(BgCommand.openPopups, {
        commandId: command.id,
        urls: urls,
        top: Math.floor(window.screenTop + rect.top - screen.availTop),
        left: Math.floor(window.screenLeft + rect.left + 50 - screen.availLeft),
        height: command.popupOption?.height,
        width: command.popupOption?.width,
        screen: getScreenSize(),
      })
    }
  },
}
