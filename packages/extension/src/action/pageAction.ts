import { Ipc, BgCommand, SidePanelPendingAction } from "@/services/ipc"
import type { OpenSidePanelProps } from "@/services/chrome"
import { Storage, SESSION_STORAGE_KEY } from "@/services/storage"
import { getWindowPosition } from "@/services/screen"
import { isValidString, isPageActionCommand } from "@/lib/utils"
import { PAGE_ACTION_OPEN_MODE, PAGE_ACTION_EVENT } from "@/const"
import { PopupOption } from "@/services/option/defaultSettings"
import type { ExecuteCommandParams, UrlParam } from "@/types"
import type { OpenAndRunProps } from "@/services/pageAction/background"
import { INSERT, templateReferencesInsert } from "@/services/pageAction"

type PageActionParams = {
  userVariables?: Array<{ name: string; value: string }>
}

export const PageAction = {
  async execute({
    selectionText,
    command,
    position,
    useSecondary,
    useClipboard,
    userVariables,
    pageUrl,
  }: ExecuteCommandParams & PageActionParams) {
    if (!isPageActionCommand(command)) {
      console.error("command is not for PageAction.")
      return
    }

    if (!isValidString(command.pageActionOption.startUrl)) {
      console.error("searchUrl is not valid.")
      return
    }

    const effectiveUserVariables =
      userVariables ?? command.pageActionOption.userVariables

    // Checks if any step needs clipboard data, directly or through a user variable
    const needClipboard = command.pageActionOption.steps.some(
      (step) =>
        step.param.type === PAGE_ACTION_EVENT.input &&
        templateReferencesInsert(
          step.param.value,
          INSERT.CLIPBOARD,
          effectiveUserVariables,
        ),
    )

    // Handle side panel mode: store pending steps in session storage, then open
    // the side panel. The background onConnect handler will pick up the pending
    // steps when the side panel content script establishes a port connection.
    if (
      command.pageActionOption.openMode === PAGE_ACTION_OPEN_MODE.SIDE_PANEL
    ) {
      const pending: SidePanelPendingAction = {
        url: command.pageActionOption.startUrl,
        steps: command.pageActionOption.steps,
        selectedText: selectionText,
        srcUrl: pageUrl ?? "",
        clipboardText: "",
        useClipboard: needClipboard || (useClipboard ?? false),
        userVariables: effectiveUserVariables,
      }
      try {
        await Storage.set<SidePanelPendingAction>(
          SESSION_STORAGE_KEY.PA_SIDE_PANEL_PENDING,
          pending,
        )
      } catch (e) {
        console.error("Failed to store pending side panel action:", e)
        return
      }
      Ipc.send<OpenSidePanelProps>(BgCommand.openSidePanel, {
        url: command.pageActionOption.startUrl,
      })
      return
    }

    if (position === null) {
      console.error("position is null.")
      return
    }

    const url: UrlParam = {
      searchUrl: command.pageActionOption.startUrl,
      selectionText,
      useClipboard: needClipboard || (useClipboard ?? false),
      pageUrl: pageUrl ?? "",
    }

    const openMode = useSecondary
      ? command.pageActionOption.openMode === PAGE_ACTION_OPEN_MODE.TAB
        ? PAGE_ACTION_OPEN_MODE.WINDOW
        : command.pageActionOption.openMode === PAGE_ACTION_OPEN_MODE.WINDOW
          ? PAGE_ACTION_OPEN_MODE.TAB
          : PAGE_ACTION_OPEN_MODE.TAB // Open in new tab when secondary is pressed
      : command.pageActionOption.openMode

    const windowPosition = await getWindowPosition()

    Ipc.send<OpenAndRunProps>(BgCommand.openAndRunPageAction, {
      commandId: command.id,
      url,
      pageUrl: command.pageActionOption.pageUrl,
      steps: command.pageActionOption.steps,
      top: Math.floor(windowPosition.top + position.y),
      left: Math.floor(windowPosition.left + position.x),
      height: command.popupOption?.height ?? PopupOption.height,
      width: command.popupOption?.width ?? PopupOption.width,
      selectedText: selectionText,
      srcUrl: pageUrl ?? "",
      openMode,
      userVariables: effectiveUserVariables,
    })
  },
}
