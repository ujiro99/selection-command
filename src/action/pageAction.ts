import { Ipc, BgCommand } from '@/services/ipc'
import { getScreenSize, getWindowPosition } from '@/services/screen'
import { isValidString, isPageActionCommand } from '@/lib/utils'
import { POPUP_TYPE, PAGE_ACTION_OPEN_MODE } from '@/const'
import type { ExecuteCommandParams, UrlParam } from '@/types'
import { OpenAndRunProps } from '@/services/pageAction/background'
import { PopupOption } from '@/services/defaultSettings'

export const PageAction = {
  async execute({
    selectionText,
    command,
    position,
    useSecondary,
    useClipboard,
  }: ExecuteCommandParams) {
    if (!isPageActionCommand(command)) {
      console.error('command is not for PageAction.')
      return
    }

    if (!isValidString(command.pageActionOption?.startUrl)) {
      console.error('searchUrl is not valid.')
      return
    }
    if (position === null) {
      console.error('position is null.')
      return
    }

    const url: UrlParam = {
      searchUrl: command.pageActionOption?.startUrl,
      selectionText,
      useClipboard: useClipboard ?? false,
    }

    const openMode = useSecondary
      ? command.pageActionOption.openMode === PAGE_ACTION_OPEN_MODE.TAB
        ? PAGE_ACTION_OPEN_MODE.POPUP
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
      type: POPUP_TYPE.POPUP,
      selectedText: selectionText,
      srcUrl: location.href,
      openMode,
    })
  },
}
