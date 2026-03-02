import { Ipc, BgCommand } from "@/services/ipc"
import {
  findAnchorElementFromParent,
  findClickableElement,
  getSelectorFromElement,
} from "@/services/dom"
import { getScreenSize } from "@/services/screen"
import { DRAG_OPEN_MODE, POPUP_TYPE } from "@/const"
import { isEmpty } from "@/lib/utils"
import type { ExecuteCommandParams } from "@/types"
import type { OpenSidePanelProps } from "@/services/chrome"

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
        Ipc.send(BgCommand.openPopups, {
          commandId: command.id,
          urls: [href],
          top: Math.floor(position.y),
          left: Math.floor(position.x),
          height: command.popupOption?.height,
          width: command.popupOption?.width,
          screen: await getScreenSize(),
          type,
        })
        return
      }

      console.warn("Href not found, trying to find clickable element")

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
          screen: await getScreenSize(),
          selector,
          type,
        })
        return
      }
    }
  },
}
