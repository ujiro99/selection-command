import { useState, useEffect } from "react"
import { Ipc, TabCommand } from "@/services/ipc"
import type { IpcCallback } from "@/services/ipc"
import { executeActionProps } from "@/services/contextMenus"

export function useContextMenu() {
  const [action, setAction] = useState<executeActionProps | null>(null)

  useEffect(() => {
    return Ipc.addListener(TabCommand.executeAction, ((
      param: executeActionProps,
    ) => {
      setAction(param)
      return false
    }) as IpcCallback)
  }, [])

  const clearAction = () => setAction(null)

  return { action, clearAction }
}
