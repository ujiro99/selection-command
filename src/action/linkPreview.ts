import { Ipc, BgCommand } from '@/services/ipc'
import {
  getScreenSize,
  findAnchorElement,
  findClickableElement,
  getSelectorFromElement,
} from '@/services/util'
import { DRAG_OPEN_MODE, POPUP_TYPE } from '@/const'
import type { ExecProps } from './index'
import { isEmpty } from '@/services/util'

export const LinkPreview = {
  async execute({ command, position, target }: ExecProps) {
    if (position && target) {
      const elm = findAnchorElement(target) as HTMLAnchorElement
      const href = elm?.href

      const type =
        command.openMode === DRAG_OPEN_MODE.PREVIEW_POPUP
          ? POPUP_TYPE.POPUP
          : POPUP_TYPE.NORMAL

      if (!isEmpty(href)) {
        Ipc.send(BgCommand.openPopups, {
          commandId: command.id,
          urls: [href],
          top: Math.floor(position.y),
          left: Math.floor(position.x),
          height: command.popupOption?.height,
          width: command.popupOption?.width,
          screen: getScreenSize(),
          type,
        })
        return
      } else {
        console.warn('href not found')
      }

      const clickElm = findClickableElement(target)
      if (clickElm) {
        const selector = getSelectorFromElement(clickElm)
        Ipc.send(BgCommand.openPopupAndClick, {
          commandId: command.id,
          urls: [location.href],
          top: Math.floor(position.y),
          left: Math.floor(position.x),
          height: command.popupOption?.height,
          width: command.popupOption?.width,
          screen: getScreenSize(),
          selector,
          type,
        })
        return
      }
    }
  },
}
