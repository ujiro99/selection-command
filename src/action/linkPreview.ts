import { Ipc, BgCommand } from '@/services/ipc'
import { getScreenSize, findAnchorElement } from '@/services/util'
import type { ExecProps } from './index'

export const LinkPreview = {
  async execute({ command, position, target }: ExecProps) {
    if (position && target) {
      const elm = findAnchorElement(target) as HTMLAnchorElement
      const href = elm?.href
      if (href == null) {
        console.warn('href not found')
        return
      }
      Ipc.send(BgCommand.openPopups, {
        commandId: command.id,
        urls: [href],
        top: Math.floor(position.y),
        left: Math.floor(position.x),
        height: command.popupOption?.height,
        width: command.popupOption?.width,
        screen: getScreenSize(),
      })
    }
  },
}
