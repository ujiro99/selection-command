import { useState, useEffect } from 'react'
import { Ipc, TabCommand } from '@/services/ipc'
import type { IpcCallback } from '@/services/ipc'
import { executeActionProps } from '@/services/contextMenus'
import { Command } from '@/types'

export function useContextMenu() {
  const [command, setCommand] = useState<Command | null>(null)
  const [useClipboard, setUseClipboard] = useState<boolean>(false)

  useEffect(() => {
    Ipc.addListener(TabCommand.executeAction, ((param: executeActionProps) => {
      setCommand(param.command)
      setUseClipboard(param.useClipboard ?? false)
      return false
    }) as IpcCallback)
    return () => {
      Ipc.removeListener(TabCommand.executeAction)
    }
  }, [])

  return { command, setCommand, useClipboard }
}
