import { Ipc, BgCommand } from '@/services/ipc'
import { toUrl, isValidString } from '@/lib/utils'
import { getScreenSize } from '@/services/screen'
import { POPUP_TYPE } from '@/const'
import type { ExecProps } from './index'

export const Window = {
  async execute({ selectionText, command, position }: ExecProps) {
    if (!isValidString(command.searchUrl)) {
      console.error('searchUrl is not valid.')
      return
    }
    if (position === null) {
      console.error('position is null.')
      return
    }

    const urls = [
      toUrl(command.searchUrl, selectionText, command.spaceEncoding),
    ]

    // Get window position
    let top = 0
    let left = 0
    try {
      const currentWindow = await chrome.windows.getCurrent()
      top = currentWindow.top ?? 0
      left = currentWindow.left ?? 0
    } catch (error) {
      console.warn('Failed to get window position:', error)
      // Use default values if window position retrieval fails
    }

    const screen = await getScreenSize()

    Ipc.send(BgCommand.openPopups, {
      commandId: command.id,
      urls: urls,
      top: Math.floor(top + position.y),
      left: Math.floor(left + position.x),
      height: command.popupOption?.height,
      width: command.popupOption?.width,
      screen,
      type: POPUP_TYPE.NORMAL,
    })
  },
}
