import { Ipc, BgCommand } from '@/services/ipc'
import type { Command } from '@/services/userSettings'

interface Props {
  urls: string[]
  command: Command
  menuElm: Element | null
  e: React.MouseEvent
}

export const Tab = {
  execute({ urls, command, e }: Props) {
    const { openMode, openModeSecondary } = command
    const background =
      e.ctrlKey && (!openModeSecondary || openMode === openModeSecondary)
    Ipc.send(BgCommand.openTab, {
      url: urls[0],
      active: !background,
    })
  },
}
