import { Ipc, BgCommand } from '@/services/ipc'

export const Option = {
  async execute() {
    Ipc.send(BgCommand.openOption)
  },
}
