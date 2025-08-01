import { Ipc, BgCommand } from "@/services/ipc"
import { isValidString } from "@/lib/utils"
import { SPACE_ENCODING } from "@/const"
import type { ExecuteCommandParams } from "@/types"
import type { OpenTabProps } from "@/services/chrome"

export const Tab = {
  async execute({
    selectionText,
    command,
    useSecondary,
    useClipboard,
  }: ExecuteCommandParams) {
    if (!isValidString(command.searchUrl)) {
      console.error("searchUrl is not valid.")
      return
    }

    const { openMode, openModeSecondary } = command
    const background =
      useSecondary && (!openModeSecondary || openMode === openModeSecondary)

    Ipc.send<OpenTabProps>(BgCommand.openTab, {
      url: {
        searchUrl: command.searchUrl,
        spaceEncoding: command.spaceEncoding ?? SPACE_ENCODING.PLUS,
        selectionText,
        useClipboard: useClipboard ?? false,
      },
      active: !background,
    })
  },
}
