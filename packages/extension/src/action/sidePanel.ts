import { isValidString, toUrl, isEmpty } from "@/lib/utils"
import { SPACE_ENCODING } from "@/const"
import type { ExecuteCommandParams, ShowToastParam } from "@/types"
import type { OpenSidePanelProps } from "@/services/chrome"
import { Ipc, BgCommand, TabCommand } from "@/services/ipc"
import { t } from "@/services/i18n"

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
    // Read clipboard text for interpolation, but don't block execution if it fails.
    let clipboardText: string = ""
    try {
      if (useClipboard && isEmpty(selectionText)) {
        clipboardText = await navigator.clipboard.readText()
      }
    } catch (e) {
      console.warn("Failed to read clipboard text:", e)

      const tabId = await Ipc.getTabId()
      await Ipc.sendTab<ShowToastParam>(tabId, TabCommand.showToast, {
        title: t("clipboard_error_title"),
        description: t("clipboard_error_description"),
        action: t("clipboard_error_action"),
      })
    }

    try {
      const url = toUrl(
        {
          searchUrl: command.searchUrl,
          spaceEncoding: command.spaceEncoding ?? SPACE_ENCODING.PLUS,
          selectionText,
          useClipboard: useClipboard ?? false,
        },
        clipboardText,
      )

      Ipc.send<OpenSidePanelProps>(BgCommand.openSidePanel, {
        url,
      })
    } catch (error) {
      console.error("Failed to open side panel:", error)
      throw error
    }
  },
}
