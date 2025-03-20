import { Ipc, BgCommand } from '@/services/ipc'
import { getScreenSize } from '@/services/dom'
import { isValidString } from '@/lib/utils'
import { POPUP_TYPE } from '@/const'
import type { ExecProps } from './index'

export const PageAction = {
  async execute({ selectionText, command, position }: ExecProps) {
    if (!isValidString(command.pageActionOption?.startUrl)) {
      console.error('searchUrl is not valid.')
      return
    }
    if (position === null) {
      console.error('position is null.')
      return
    }

    const clipboard = await navigator.clipboard.readText()
    const urls = [command.pageActionOption?.startUrl]

    Ipc.send(BgCommand.openAndRunPageAction, {
      commandId: command.id,
      urls,
      top: Math.floor(window.screenTop + position.y),
      left: Math.floor(window.screenLeft + position.x),
      height: command.popupOption?.height,
      width: command.popupOption?.width,
      screen: getScreenSize(),
      type: POPUP_TYPE.POPUP,
      selectedText: selectionText,
      clipboardText: clipboard,
      srcUrl: location.href,
      openMode: command.pageActionOption.openMode,
    })
  },
}
