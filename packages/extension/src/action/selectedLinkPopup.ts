import { Ipc, ServiceWorkerCommand } from "@/services/ipc"
import { urlsInSelection } from "@/services/dom"
import { getWindowPosition } from "@/services/screen"
import {
  OpenPopupsProps,
  OpenTabsProps,
  OpenSidePanelProps,
} from "@/services/chrome"
import { OPEN_MODE, POPUP_TYPE } from "@/const"
import { isLinkPopupType } from "@/types/schema"
import type { ExecuteCommandParams } from "@/types"

export const SelectedLinkPopup = {
  async execute({
    command,
    position,
    selectionText,
    useSecondary,
  }: ExecuteCommandParams) {
    if (!isLinkPopupType(command)) {
      console.error("command is not for SelectedLinkPopup.")
      return
    }

    // The menu item is disabled when no URL is found, but a shortcut can
    // still execute this command with any selection.
    const urls = urlsInSelection(selectionText)
    if (urls.length === 0) {
      console.warn("no URL is found in the selection.")
      return
    }

    // Commands created before the open mode option was added use popups,
    // and the primary open mode when the secondary one is not set.
    const option = command.linkPopupOption
    const openMode =
      (useSecondary ? option?.openModeSecondary : undefined) ??
      option?.openMode ??
      OPEN_MODE.POPUP
    switch (openMode) {
      case OPEN_MODE.TAB:
      case OPEN_MODE.BACKGROUND_TAB:
        Ipc.send<OpenTabsProps>(ServiceWorkerCommand.openTabs, {
          urls,
          active: openMode === OPEN_MODE.TAB,
        })
        return
      case OPEN_MODE.SIDE_PANEL:
        // The side panel can show only one page.
        if (urls.length > 1) {
          console.warn("the side panel cannot open multiple URLs.")
          return
        }
        Ipc.send<OpenSidePanelProps>(ServiceWorkerCommand.openSidePanel, {
          url: urls[0],
        })
        return
      case OPEN_MODE.POPUP:
      case OPEN_MODE.WINDOW: {
        if (!position) {
          console.error("position is null.")
          return
        }
        const windowPosition = await getWindowPosition()
        const isWindow = openMode === OPEN_MODE.WINDOW
        Ipc.send<OpenPopupsProps>(ServiceWorkerCommand.openPopups, {
          commandId: command.id,
          urls,
          top: Math.floor(windowPosition.top + position.y),
          left: Math.floor(windowPosition.left + position.x + 20),
          height: command.popupOption?.height,
          width: command.popupOption?.width,
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
