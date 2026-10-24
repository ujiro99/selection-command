import { useState, useEffect } from "react"
import { Ipc, TabCommand } from "@/services/ipc"
import type { IpcCallback } from "@/services/ipc"
import { executeActionProps } from "@/services/contextMenus"

export function useContextMenu() {
  const [action, setAction] = useState<executeActionProps | null>(null)

  useEffect(() => {
    Ipc.addListener(TabCommand.executeAction, ((param: executeActionProps) => {
      setAction(param)
      return false
    }) as IpcCallback)
    return () => {
      Ipc.removeListener(TabCommand.executeAction)
    }
  }, [])

  const clearAction = () => setAction(null)

  return { action, clearAction }
}
