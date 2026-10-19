import { Ipc, ServiceWorkerCommand } from "@/services/ipc"
import { isValidString } from "@/lib/utils"
import { SPACE_ENCODING } from "@/const"
import type { ExecuteCommandParams } from "@/types"
import type { OpenTabProps } from "@/services/chrome"

export const Tab = {
  async execute({
    selectionText,
    command,
    selectionFromClipboard,
    pageUrl,
  }: ExecuteCommandParams) {
    if (!isValidString(command.searchUrl)) {
      console.error("searchUrl is not valid.")
      return
    }

    Ipc.send<OpenTabProps>(ServiceWorkerCommand.openTab, {
      url: {
        searchUrl: command.searchUrl,
        spaceEncoding: command.spaceEncoding ?? SPACE_ENCODING.PLUS,
        selectionText,
        selectionFromClipboard: selectionFromClipboard ?? false,
        pageUrl: pageUrl ?? "",
      },
      active: true,
    })
  },
}
