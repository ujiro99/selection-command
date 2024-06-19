import { Ipc, BgCommand } from '@/services/ipc'
import { getSceenSize, linksInSelection } from '@/services/util'
import type { ExecProps } from './index'

export const LinkPopup = {
  execute({ command, menuElm }: ExecProps) {
    if (menuElm) {
      const rect = menuElm.getBoundingClientRect()
      Ipc.send(BgCommand.openPopups, {
        commandId: command.id,
        urls: linksInSelection(),
        top: Math.floor(window.screenTop + rect.top),
        left: Math.floor(window.screenLeft + rect.left + 20),
        height: command.popupOption?.height,
        width: command.popupOption?.width,
        screen: getSceenSize(),
      })
    }
  },
}
