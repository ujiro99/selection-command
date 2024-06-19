import { Ipc, BgCommand } from '@/services/ipc'

export const Option = {
  execute() {
    Ipc.send(BgCommand.openOption)
  },
}
