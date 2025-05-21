import { Ipc, BgCommand } from '@/services/ipc'
import { linksInSelection } from '@/services/dom'
import { getScreenSize } from '@/services/screen'
import type { ExecProps } from './index'

export const SelectedLinkPopup = {
  async execute({ command, position }: ExecProps) {
    if (position) {
      Ipc.send(BgCommand.openPopups, {
        commandId: command.id,
        urls: linksInSelection(),
        top: Math.floor(window.screenTop + position.y),
        left: Math.floor(window.screenLeft + position.x + 20),
        height: command.popupOption?.height,
        width: command.popupOption?.width,
        screen: getScreenSize(),
      })
    }
  },
}
