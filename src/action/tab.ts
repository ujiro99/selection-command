import { Ipc, BgCommand } from '@/services/ipc'
import { toUrl } from '@/services/util'
import type { ExecProps } from './index'

export const Tab = {
  execute({ selectionText, command, e }: ExecProps) {
    const url = toUrl(command.searchUrl, selectionText)
    const { openMode, openModeSecondary } = command
    const background =
      e.ctrlKey && (!openModeSecondary || openMode === openModeSecondary)
    Ipc.send(BgCommand.openTab, {
      url,
      active: !background,
    })
  },
}
