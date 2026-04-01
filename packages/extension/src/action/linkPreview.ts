import { Ipc, BgCommand } from "@/services/ipc"
import {
  findAnchorElementFromParent,
  findClickableElement,
  getSelectorFromElement,
} from "@/services/dom"
import { DRAG_OPEN_MODE, POPUP_TYPE } from "@/const"
import { isEmpty } from "@/lib/utils"
import type { ExecuteCommandParams } from "@/types"
import type {
  OpenPopupsProps,
  OpenSidePanelProps,
  OpenPopupAndClickProps,
} from "@/services/chrome"

export const LinkPreview = {
  async execute({ command, position, target }: ExecuteCommandParams) {
    if (position && target) {
      const elm = findAnchorElementFromParent(target) as HTMLAnchorElement
      const href = elm?.href

      if (command.openMode === DRAG_OPEN_MODE.PREVIEW_SIDE_PANEL) {
        if (!isEmpty(href)) {
          Ipc.send<OpenSidePanelProps>(BgCommand.openSidePanel, {
            url: href,
            isLinkCommand: true,
          })
        }
        return
      }

      const type =
        command.openMode === DRAG_OPEN_MODE.PREVIEW_POPUP
          ? POPUP_TYPE.POPUP
          : POPUP_TYPE.NORMAL

      if (!isEmpty(href)) {
        Ipc.send<OpenPopupsProps>(BgCommand.openPopups, {
          commandId: command.id,
          urls: [href],
          top: Math.floor(position.y),
          left: Math.floor(position.x),
          height: command.popupOption?.height,
          width: command.popupOption?.width,
          type,
        })
        return
      }

      console.warn("Href not found, trying to find clickable element")

      const clickElm = findClickableElement(target)

      if (clickElm) {
        const selector = getSelectorFromElement(clickElm)
        Ipc.send<OpenPopupAndClickProps>(BgCommand.openPopupAndClick, {
          commandId: command.id,
          url: location.href,
          top: Math.floor(position.y),
          left: Math.floor(position.x),
          height: command.popupOption?.height,
          width: command.popupOption?.width,
          selector,
          type,
        })
        return
      }
    }
  },
}
