import { Ipc, BgCommand } from '@/services/ipc'
import { getScreenSize } from '@/services/screen'
import { isValidString, isPageActionCommand } from '@/lib/utils'
import { POPUP_TYPE, PAGE_ACTION_OPEN_MODE } from '@/const'
import type { ExecProps } from './index'

/**
 * Read text from clipboard with retry mechanism
 * @param maxRetries Maximum number of retry attempts (default: 3)
 * @param delayMs Delay between retries in milliseconds (default: 100)
 * @returns Promise<string> Clipboard content or empty string if all attempts fail
 */
const readClipboardWithRetry = async (
  maxRetries = 3,
  delayMs = 100,
): Promise<string> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await new Promise<void>((resolve) => setTimeout(resolve, delayMs))
      return await navigator.clipboard.readText()
    } catch (error) {
      console.warn(
        `Failed to read clipboard (attempt ${i + 1}/${maxRetries}):`,
        error,
      )
      if (i === maxRetries - 1) {
        return ''
      }
    }
  }
  return ''
}

export const PageAction = {
  async execute({ selectionText, command, position, useSecondary }: ExecProps) {
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

    const clipboard = await readClipboardWithRetry()
    const urls = [command.pageActionOption?.startUrl]
    const openMode = useSecondary
      ? command.pageActionOption.openMode === PAGE_ACTION_OPEN_MODE.TAB
        ? PAGE_ACTION_OPEN_MODE.POPUP
        : PAGE_ACTION_OPEN_MODE.TAB
      : command.pageActionOption.openMode

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

    Ipc.send(BgCommand.openAndRunPageAction, {
      commandId: command.id,
      urls,
      top: Math.floor(top + position.y),
      left: Math.floor(left + position.x),
      height: command.popupOption?.height,
      width: command.popupOption?.width,
      screen,
      type: POPUP_TYPE.POPUP,
      selectedText: selectionText,
      clipboardText: clipboard,
      srcUrl: location.href,
      openMode,
    })
  },
}
