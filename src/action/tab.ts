import { Ipc, BgCommand } from '@/services/ipc'
import { toUrl, isValidString } from '@/lib/utils'
import type { ExecuteCommandParams } from '@/types'

export const Tab = {
  async execute({
    selectionText,
    command,
    useSecondary,
  }: ExecuteCommandParams) {
    if (!isValidString(command.searchUrl)) {
      console.error('searchUrl is not valid.')
      return
    }

    const url = toUrl(command.searchUrl, selectionText)
    const { openMode, openModeSecondary } = command
    const background =
      useSecondary && (!openModeSecondary || openMode === openModeSecondary)
    Ipc.send(BgCommand.openTab, {
      url,
      active: !background,
    })
  },
}
