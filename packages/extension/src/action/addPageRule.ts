import { Ipc, ServiceWorkerCommand } from "@/services/ipc"

export const AddPageRule = {
  async execute() {
    Ipc.send(ServiceWorkerCommand.addPageRule, {
      url: window.location.origin,
    })
  },
}
