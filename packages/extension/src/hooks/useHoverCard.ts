import { useCallback, useEffect, useRef, useState } from "react"
import {
  loadHoverCard,
  HoverCardError,
  type HoverCardErrorKind,
} from "@/services/hoverCard"
import { getUILanguage } from "@/services/i18n"
import { isHoverCardCommand } from "@/lib/commandGuards"
import type { Command, SelectionCommand } from "@/types"

// Delay before revealing the card on hover; shorter delays cause false triggers.
export const HOVER_CARD_SHOW_DELAY_MS = 700
// Grace period to move the pointer from the button to the card.
export const HOVER_CARD_HIDE_DELAY_MS = 150

export type HoverCardState =
  | { status: "idle" }
  | { status: "loading"; progress?: number }
  | { status: "success"; content: React.ReactNode }
  | { status: "empty" }
  | { status: "error"; kind: HoverCardErrorKind }

type Params = {
  command: Command | SelectionCommand
  selectionText: string
}

/**
 * Hover interaction for HOVER_CARD commands.
 * Inert for other commands, so it can be called unconditionally.
 */
export function useHoverCard({ command, selectionText }: Params) {
  const providerId = isHoverCardCommand(command)
    ? command.hoverCardOption.provider
    : null
  const enabled = providerId != null

  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [state, setState] = useState<HoverCardState>({ status: "idle" })

  const showTimer = useRef<number>()
  const hideTimer = useRef<number>()
  const controller = useRef<AbortController>()

  const clearTimers = () => {
    window.clearTimeout(showTimer.current)
    window.clearTimeout(hideTimer.current)
  }

  // Reset when the selection changes.
  useEffect(() => {
    controller.current?.abort()
    setState({ status: "idle" })
    setOpen(false)
    setPinned(false)
  }, [selectionText, providerId])

  useEffect(
    () => () => {
      clearTimers()
      controller.current?.abort()
    },
    [],
  )

  const load = useCallback(async () => {
    if (!providerId) return
    controller.current?.abort()
    const ac = new AbortController()
    controller.current = ac

    setState({ status: "loading" })
    try {
      const content = await loadHoverCard(providerId, selectionText, {
        signal: ac.signal,
        ctx: {
          uiLanguage: getUILanguage(),
          onProgress: (progress) => {
            if (!ac.signal.aborted) setState({ status: "loading", progress })
          },
        },
      })
      if (ac.signal.aborted) return
      setState(
        content == null ? { status: "empty" } : { status: "success", content },
      )
    } catch (e) {
      if (ac.signal.aborted) return
      const kind = e instanceof HoverCardError ? e.kind : "failed"
      setState({ status: "error", kind })
    }
  }, [providerId, selectionText])

  const needsLoad =
    state.status === "idle" ||
    (state.status === "error" && state.kind === "needsActivation")

  const show = () => {
    setOpen(true)
    if (state.status === "idle") load()
  }

  const onPointerEnter = () => {
    if (!enabled) return
    window.clearTimeout(hideTimer.current)
    if (open) return
    showTimer.current = window.setTimeout(show, HOVER_CARD_SHOW_DELAY_MS)
  }

  const onPointerLeave = () => {
    if (!enabled) return
    window.clearTimeout(showTimer.current)
    if (pinned) return
    hideTimer.current = window.setTimeout(
      () => setOpen(false),
      HOVER_CARD_HIDE_DELAY_MS,
    )
  }

  /**
   * Click pins the card and loads immediately.
   * The click is a user activation, which allows a model download.
   */
  const onClick = () => {
    if (!enabled) return
    clearTimers()
    setOpen(true)
    setPinned((p) => !p || needsLoad)
    if (needsLoad) load()
  }

  return {
    enabled,
    open: enabled && open && state.status !== "empty",
    pinned,
    state,
    onClick,
    triggerProps: {
      onMouseEnter: onPointerEnter,
      onMouseLeave: onPointerLeave,
    },
    cardProps: {
      onMouseEnter: onPointerEnter,
      onMouseLeave: onPointerLeave,
    },
  }
}
