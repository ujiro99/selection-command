import { Ipc, ServiceWorkerCommand } from "@/services/ipc"
import { urlsInSelection } from "@/services/dom"
import { getWindowPosition } from "@/services/screen"
import { OPEN_MODE, POPUP_TYPE } from "@/const"
import { resolvePopupSize } from "@/services/option/defaultSettings"
import { isOpenUrlType } from "@/types/schema"
import type { ActionExecuteParams } from "@/types"
import type {
  OpenPopupProps,
  OpenTabProps,
  OpenSidePanelProps,
} from "@/services/chrome"

export const OpenUrl = {
  async execute({ selectionText, command, position }: ActionExecuteParams) {
    if (!isOpenUrlType(command)) {
      console.error("command is not for OpenUrl.")
      return
    }

    // The menu item is disabled unless exactly one URL is found, but a
    // shortcut can still execute this command with any selection.
    const urls = urlsInSelection(selectionText)
    if (urls.length !== 1) {
      console.warn(`expected one URL in the selection, found ${urls.length}.`)
      return
    }
    const url = urls[0]

    const openMode = command.openUrlOption.openMode
    switch (openMode) {
      case OPEN_MODE.TAB:
      case OPEN_MODE.BACKGROUND_TAB:
        Ipc.send<OpenTabProps>(ServiceWorkerCommand.openTab, {
          url,
          active: openMode === OPEN_MODE.TAB,
        })
        return
      case OPEN_MODE.SIDE_PANEL:
        Ipc.send<OpenSidePanelProps>(ServiceWorkerCommand.openSidePanel, {
          url,
        })
        return
      case OPEN_MODE.POPUP:
      case OPEN_MODE.WINDOW: {
        if (position === null) {
          console.error("position is null.")
          return
        }
        const windowPosition = await getWindowPosition()
        const isWindow = openMode === OPEN_MODE.WINDOW
        Ipc.send<OpenPopupProps>(ServiceWorkerCommand.openPopup, {
          commandId: command.id,
          url,
          top: Math.floor(windowPosition.top + position.y),
          left: Math.floor(windowPosition.left + position.x),
          ...resolvePopupSize(command.popupOption),
          type: isWindow ? POPUP_TYPE.NORMAL : POPUP_TYPE.POPUP,
          windowState: isWindow ? command.windowState : undefined,
        })
        return
      }
      default:
        console.error(`unsupported open mode: ${openMode}`)
    }
  },
}
