import { Ipc, BgCommand } from '@/services/ipc'

export const AddPageRule = {
  async execute() {
    Ipc.send(BgCommand.addPageRule, {
      url: window.location.origin,
    })
  },
}
