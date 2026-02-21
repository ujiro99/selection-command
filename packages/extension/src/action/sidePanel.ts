import { isValidString, toUrl } from "@/lib/utils"
import { SPACE_ENCODING } from "@/const"
import type { ExecuteCommandParams } from "@/types"
import type { OpenSidePanelProps } from "@/services/chrome"
import { Ipc, BgCommand } from "@/services/ipc"

export const SidePanel = {
  async execute({
    selectionText,
    command,
    useClipboard,
  }: ExecuteCommandParams) {
    if (!isValidString(command.searchUrl)) {
      console.error("searchUrl is not valid.")
      return
    }

    try {
      const url = toUrl({
        searchUrl: command.searchUrl,
        spaceEncoding: command.spaceEncoding ?? SPACE_ENCODING.PLUS,
        selectionText,
        useClipboard: useClipboard ?? false,
      })

      Ipc.send<OpenSidePanelProps>(BgCommand.openSidePanel, {
        url,
      })
    } catch (error) {
      console.error("Failed to open side panel:", error)
      throw error
    }
  },
}
