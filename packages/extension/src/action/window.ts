import { Ipc, ServiceWorkerCommand } from "@/services/ipc"
import { isValidString } from "@/lib/utils"
import { getWindowPosition } from "@/services/screen"
import { POPUP_TYPE, SPACE_ENCODING } from "@/const"
import { resolvePopupSize } from "@/services/option/defaultSettings"
import type { OpenPopupProps } from "@/services/chrome"
import type { ExecuteCommandParams } from "@/types"

export const Window = {
  async execute({
    selectionText,
    command,
    position,
    selectionFromClipboard,
    pageUrl,
  }: ExecuteCommandParams) {
    if (!isValidString(command.searchUrl)) {
      console.error("searchUrl is not valid.")
      return
    }
    if (position === null) {
      console.error("position is null.")
      return
    }

    const windowPosition = await getWindowPosition()

    Ipc.send<OpenPopupProps>(ServiceWorkerCommand.openPopup, {
      commandId: command.id,
      url: {
        searchUrl: command.searchUrl,
        spaceEncoding: command.spaceEncoding ?? SPACE_ENCODING.PLUS,
        selectionText,
        selectionFromClipboard: selectionFromClipboard ?? false,
        pageUrl: pageUrl ?? "",
      },
      top: Math.floor(windowPosition.top + position.y),
      left: Math.floor(windowPosition.left + position.x),
      ...resolvePopupSize(command.popupOption),
      type: POPUP_TYPE.NORMAL,
      windowState: command.windowState,
    })
  },
}
