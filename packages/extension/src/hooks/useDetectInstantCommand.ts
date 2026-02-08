import { useEffect, useCallback } from "react"
import { KEYBOARD } from "@/const"
import { useUserSettings } from "@/hooks/useSettings"
import { useSelectContext } from "@/hooks/useSelectContext"
import { useCommandExecutor } from "@/hooks/useCommandExecutor"
import { Command } from "@/types"
import { isEmpty, isMac } from "@/lib/utils"

/**
 * Hook to detect and execute instant command when modifier key + text selection occurs
 */
export function useDetectInstantCommand(positionElm: Element | null) {
  const { userSettings: settings } = useUserSettings()
  const { selectionText, target } = useSelectContext()
  const executeCommand = useCommandExecutor()

  const enabled = settings.instantCommand?.enabled ?? false
  const commandId = settings.instantCommand?.commandId
  const modifierKey = settings.instantCommand?.modifierKey

  // Find the command from settings
  const command = settings.commands?.find((cmd) => cmd.id === commandId) as
    | Command
    | undefined

  const checkModifierKey = useCallback(
    (event: MouseEvent): boolean => {
      if (!modifierKey) return false

      switch (modifierKey) {
        case KEYBOARD.SHIFT:
          return event.shiftKey
        case KEYBOARD.CTRL:
          // On Mac, Ctrl is mapped to Meta key
          return isMac() ? event.metaKey : event.ctrlKey
        case KEYBOARD.ALT:
          return event.altKey
        case KEYBOARD.META:
          return event.metaKey
        default:
          return false
      }
    },
    [modifierKey],
  )

  useEffect(() => {
    if (!enabled || !command || !modifierKey) return

    const handleMouseUp = (event: MouseEvent) => {
      // Check if modifier key is pressed
      if (!checkModifierKey(event)) return

      // Check if there's selected text
      const selection = window.getSelection()
      const selectedText = selection?.toString().trim()
      if (!selectedText || isEmpty(selectedText)) return

      // Execute the instant command
      const position = positionElm
        ? {
            x: event.clientX,
            y: event.clientY,
          }
        : null

      executeCommand({
        command,
        position,
        selectionText: selectedText,
        target: target ?? null,
      })
    }

    // Listen to mouseup event to detect selection completion with modifier key
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [
    enabled,
    command,
    modifierKey,
    checkModifierKey,
    executeCommand,
    positionElm,
    target,
    selectionText,
  ])
}
