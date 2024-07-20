import { Ipc, BgCommand } from '@/services/ipc'
import { toUrl } from '@/services/util'
import type { ExecProps } from './index'

export const Tab = {
  async execute({ selectionText, command, useSecondary }: ExecProps) {
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
