import { useCallback, useEffect, useRef, useState } from "react"
import {
  loadHoverCard,
  HoverCardError,
  type HoverCardErrorKind,
} from "@/services/hoverCard"
import type { OpenHoverCardWindowProps } from "@/services/hoverCard/window"
import { getUILanguage } from "@/services/i18n"
import { Ipc, ServiceWorkerCommand } from "@/services/ipc"
import { isHoverCardCommand } from "@/lib/commandGuards"
import type { Command, HoverCardProviderId, SelectionCommand } from "@/types"

// Delay before revealing the card on hover; shorter delays cause false triggers.
export const HOVER_CARD_SHOW_DELAY_MS = 700
// Grace period to move the pointer from the button to the card.
export const HOVER_CARD_HIDE_DELAY_MS = 150
// Gap between the menu item and the kept window.
const KEEP_WINDOW_GAP = 8

export type HoverCardState =
  | { status: "idle" }
  | { status: "loading"; progress?: number }
  | { status: "success"; content: React.ReactNode }
  | { status: "empty" }
  | { status: "error"; kind: HoverCardErrorKind }

/**
 * Runs a hover card provider and tracks its state.
 * Starting a new load cancels the previous one.
 */
export function useHoverCardLoader(providerId: HoverCardProviderId | null) {
  const [state, setState] = useState<HoverCardState>({ status: "idle" })
  const controller = useRef<AbortController>()

  useEffect(() => () => controller.current?.abort(), [])

  const reset = useCallback(() => {
    controller.current?.abort()
    setState({ status: "idle" })
  }, [])

  const load = useCallback(
    async (text: string, pageLang?: string) => {
      if (!providerId) return
      controller.current?.abort()
      const ac = new AbortController()
      controller.current = ac

      setState({ status: "loading" })
      try {
        const content = await loadHoverCard(providerId, text, {
          signal: ac.signal,
          ctx: {
            uiLanguage: getUILanguage(),
            pageLang,
            onProgress: (progress) => {
              if (!ac.signal.aborted) setState({ status: "loading", progress })
            },
          },
        })
        if (ac.signal.aborted) return
        setState(
          content == null
            ? { status: "empty" }
            : { status: "success", content },
        )
      } catch (e) {
        if (ac.signal.aborted) return
        const kind = e instanceof HoverCardError ? e.kind : "failed"
        setState({ status: "error", kind })
      }
    },
    [providerId],
  )

  return { state, load, reset }
}

/** Whether loading again may help, e.g. after a click gave a user activation. */
export const needsLoad = (state: HoverCardState): boolean =>
  state.status === "idle" ||
  (state.status === "error" && state.kind === "needsActivation")

type Params = {
  command: Command | SelectionCommand
  selectionText: string
}

/**
 * Hover interaction for HOVER_CARD commands.
 * Inert for other commands, so it can be called unconditionally.
 */
export function useHoverCard({ command, selectionText }: Params) {
  const hoverCardCommand = isHoverCardCommand(command) ? command : null
  const providerId = hoverCardCommand?.hoverCardOption.provider ?? null
  const enabled = providerId != null

  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const { state, load: loadText, reset } = useHoverCardLoader(providerId)

  const showTimer = useRef<number>()
  const hideTimer = useRef<number>()

  const clearTimers = () => {
    window.clearTimeout(showTimer.current)
    window.clearTimeout(hideTimer.current)
  }

  // Reset when the selection changes.
  useEffect(() => {
    reset()
    setOpen(false)
    setPinned(false)
  }, [selectionText, providerId, reset])

  useEffect(() => () => clearTimers(), [])

  const load = () => loadText(selectionText, document.documentElement.lang)

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
    const reload = needsLoad(state)
    setPinned((p) => !p || reload)
    if (reload) load()
  }

  /**
   * Reopen the card as a separate window that stays open and follows
   * the selection. The window is placed beside the anchor (menu item).
   */
  const keep = (anchor: Element | null) => {
    if (!hoverCardCommand) return
    clearTimers()
    setOpen(false)
    setPinned(false)

    const rect = anchor?.getBoundingClientRect()
    // Screen coordinates; the browser UI height is added to the page offset.
    const toolbarHeight = window.outerHeight - window.innerHeight
    Ipc.send<OpenHoverCardWindowProps>(
      ServiceWorkerCommand.openHoverCardWindow,
      {
        providerId: hoverCardCommand.hoverCardOption.provider,
        title: hoverCardCommand.title,
        text: selectionText,
        pageLang: document.documentElement.lang,
        top: Math.floor(window.screenY + toolbarHeight + (rect?.top ?? 0)),
        left: Math.floor(window.screenX + (rect?.right ?? 0) + KEEP_WINDOW_GAP),
      },
    )
  }

  return {
    enabled,
    open: enabled && open && state.status !== "empty",
    pinned,
    state,
    onClick,
    keep,
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
