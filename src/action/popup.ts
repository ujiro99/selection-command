import { Ipc, BgCommand } from '@/services/ipc'
import { getSceenSize } from '@/services/util'
import type { Command } from '@/services/userSettings'

interface PopupProps {
  urls: string[]
  command: Command
  menuElm: Element | null
}

export const Popup = {
  execute({ urls, command, menuElm }: PopupProps) {
    if (menuElm) {
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
