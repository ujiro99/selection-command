import { useEffect, useState } from "react"
import { useSelectContext } from "@/hooks/useSelectContext"
import { logHoverCard } from "@/services/hoverCard/log"
import {
  HoverCardWindowStore,
  type HoverCardWindowState,
} from "@/services/hoverCard/window"

// Coalesce the selectionchange events fired while dragging.
const SYNC_DELAY_MS = 100

/**
 * Sends the selection on this page to the hover card window while it is open.
 * Renders nothing.
 */
export function HoverCardWindowSync() {
  const { selectionText } = useSelectContext()
  const [windowOpen, setWindowOpen] = useState(false)

  useEffect(() => {
    let alive = true
    HoverCardWindowStore.get()
      .then((s) => alive && setWindowOpen(s != null))
      .catch(() => {})
    const unsubscribe = HoverCardWindowStore.subscribe(
      (s: HoverCardWindowState | null) => {
        logHoverCard("window state changed:", s != null)
        setWindowOpen(s != null)
      },
    )
    return () => {
      alive = false
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!windowOpen) return
    const text = selectionText.trim()
    // Keep the last input when the selection is cleared.
    if (!text) return
    const timer = window.setTimeout(() => {
      logHoverCard("sync selection to window:", text.slice(0, 60))
      HoverCardWindowStore.updateInput(
        text,
        document.documentElement.lang,
      ).catch((e) => console.error("Failed to update the hover card window", e))
    }, SYNC_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [windowOpen, selectionText])

  return null
}
