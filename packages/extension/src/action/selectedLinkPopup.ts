import { Ipc, BgCommand } from "@/services/ipc"
import { linksInSelection } from "@/services/dom"
import { OpenPopupsProps } from "@/services/chrome"
import { POPUP_TYPE } from "@/const"
import type { ExecuteCommandParams } from "@/types"

export const SelectedLinkPopup = {
  async execute({ command, position }: ExecuteCommandParams) {
    if (position) {
      Ipc.send<OpenPopupsProps>(BgCommand.openPopups, {
        commandId: command.id,
        urls: linksInSelection(),
        top: Math.floor(window.screenTop + position.y),
        left: Math.floor(window.screenLeft + position.x + 20),
        height: command.popupOption?.height,
        width: command.popupOption?.width,
        type: POPUP_TYPE.POPUP,
      })
    }
  },
}
