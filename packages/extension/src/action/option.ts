import { Ipc, ServiceWorkerCommand } from "@/services/ipc"

export const Option = {
  async execute() {
    Ipc.send(ServiceWorkerCommand.openOption)
  },
}
