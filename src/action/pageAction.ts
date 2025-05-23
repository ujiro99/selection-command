import { Ipc, BgCommand } from '@/services/ipc'
import { getScreenSize, getWindowPosition } from '@/services/screen'
import { isValidString, isPageActionCommand } from '@/lib/utils'
import { POPUP_TYPE, PAGE_ACTION_OPEN_MODE } from '@/const'
import type { ExecuteCommandParams } from '@/types'

export const PageAction = {
  async execute({
    selectionText,
    command,
    position,
    useSecondary,
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

    const clipboardText = await Ipc.send(BgCommand.getClipboard)
    const urls = [command.pageActionOption?.startUrl]
    const openMode = useSecondary
      ? command.pageActionOption.openMode === PAGE_ACTION_OPEN_MODE.TAB
        ? PAGE_ACTION_OPEN_MODE.POPUP
        : PAGE_ACTION_OPEN_MODE.TAB
      : command.pageActionOption.openMode

    const windowPosition = await getWindowPosition()
    const screen = await getScreenSize()

    Ipc.send(BgCommand.openAndRunPageAction, {
      commandId: command.id,
      urls,
      top: Math.floor(windowPosition.top + position.y),
      left: Math.floor(windowPosition.left + position.x),
      height: command.popupOption?.height,
      width: command.popupOption?.width,
      screen,
      type: POPUP_TYPE.POPUP,
      selectedText: selectionText,
      clipboardText,
      srcUrl: location.href,
      openMode,
    })
  },
}
