import { Ipc, BgCommand } from "@/services/ipc"
import { isValidString } from "@/lib/utils"
import { SPACE_ENCODING } from "@/const"
import type { ExecuteCommandParams } from "@/types"
import type { OpenTabProps } from "@/services/chrome"

export const BackgroundTab = {
  async execute({
    selectionText,
    command,
    allowClipboardFallback,
    pageUrl,
  }: ExecuteCommandParams) {
    if (!isValidString(command.searchUrl)) {
      console.error("searchUrl is not valid.")
      return
    }

    Ipc.send<OpenTabProps>(BgCommand.openTab, {
      url: {
        searchUrl: command.searchUrl,
        spaceEncoding: command.spaceEncoding ?? SPACE_ENCODING.PLUS,
        selectionText,
        useClipboard: allowClipboardFallback ?? false,
        pageUrl: pageUrl ?? "",
      },
      active: false,
    })
  },
}
