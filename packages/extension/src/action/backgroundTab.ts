import { Ipc, ServiceWorkerCommand } from "@/services/ipc"
import { isValidString } from "@/lib/utils"
import { SPACE_ENCODING } from "@/const"
import type { ActionExecuteParams } from "@/types"
import type { OpenTabProps } from "@/services/chrome"

export const BackgroundTab = {
  async execute({
    selectionText,
    command,
    selectionFromClipboard,
    pageUrl,
  }: ActionExecuteParams) {
    if (!isValidString(command.searchUrl)) {
      console.error("searchUrl is not valid.")
      return
    }

    Ipc.send<OpenTabProps>(ServiceWorkerCommand.openTab, {
      url: {
        searchUrl: command.searchUrl,
        spaceEncoding: command.spaceEncoding ?? SPACE_ENCODING.PLUS,
        selectionText,
        selectionFromClipboard,
        pageUrl: pageUrl ?? "",
      },
      active: false,
    })
  },
}
