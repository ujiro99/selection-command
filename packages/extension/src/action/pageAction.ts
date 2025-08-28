import { Ipc, BgCommand } from "@/services/ipc"
import { getScreenSize, getWindowPosition } from "@/services/screen"
import { isValidString, isPageActionCommand } from "@/lib/utils"
import { PAGE_ACTION_OPEN_MODE } from "@/const"
import { PopupOption } from "@/services/option/defaultSettings"
import type { ExecuteCommandParams, UrlParam } from "@/types"
import type { OpenAndRunProps } from "@/services/pageAction/background"

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
  }: ExecuteCommandParams & PageActionParams) {
    if (!isPageActionCommand(command)) {
      console.error("command is not for PageAction.")
      return
    }

    if (!isValidString(command.pageActionOption.startUrl)) {
      console.error("searchUrl is not valid.")
      return
    }
    if (position === null) {
      console.error("position is null.")
      return
    }

    const url: UrlParam = {
      searchUrl: command.pageActionOption.startUrl,
      selectionText,
      useClipboard: useClipboard ?? false,
    }

    const openMode = useSecondary
      ? command.pageActionOption.openMode === PAGE_ACTION_OPEN_MODE.TAB
        ? PAGE_ACTION_OPEN_MODE.WINDOW
        : command.pageActionOption.openMode === PAGE_ACTION_OPEN_MODE.WINDOW
          ? PAGE_ACTION_OPEN_MODE.TAB
          : PAGE_ACTION_OPEN_MODE.TAB
      : command.pageActionOption.openMode

    const windowPosition = await getWindowPosition()
    const screen = await getScreenSize()

    Ipc.send<OpenAndRunProps>(BgCommand.openAndRunPageAction, {
      commandId: command.id,
      url,
      top: Math.floor(windowPosition.top + position.y),
      left: Math.floor(windowPosition.left + position.x),
      height: command.popupOption?.height ?? PopupOption.height,
      width: command.popupOption?.width ?? PopupOption.width,
      screen,
      selectedText: selectionText,
      srcUrl: location.href,
      openMode,
      userVariables: userVariables ?? command.pageActionOption.userVariables,
    })
  },
}
