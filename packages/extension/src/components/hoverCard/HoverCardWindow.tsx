import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { t } from "@/services/i18n"
import { themeContext, useTheme } from "@/hooks/useTheme"
import { useHoverCardLoader, needsLoad } from "@/hooks/useHoverCard"
import {
  HoverCardWindowStore,
  HOVER_CARD_WINDOW_INPUT_DEBOUNCE_MS,
  type HoverCardWindowState,
} from "@/services/hoverCard/window"
import { HoverCardBody } from "./HoverCardPanel"
import css from "./HoverCard.module.css"

/**
 * Page of the hover card window opened by "Keep".
 * Shows the latest selection and its result, and runs the provider again
 * when the selection on a web page changes.
 */
export function HoverCardWindow() {
  const theme = useTheme(document.documentElement)
  const [input, setInput] = useState<HoverCardWindowState | null>(null)
  const { state, load } = useHoverCardLoader(input?.providerId ?? null)
  const loadedOnce = useRef(false)

  useEffect(() => {
    HoverCardWindowStore.get().then(setInput)
    return HoverCardWindowStore.subscribe((s) => {
      // Keep showing the last result while the state is being cleared.
      if (s != null) setInput(s)
    })
  }, [])

  useEffect(() => {
    if (input?.title) document.title = input.title
  }, [input?.title])

  const text = input?.text ?? ""
  const pageLang = input?.pageLang
  const providerId = input?.providerId

  useEffect(() => {
    if (!providerId || !text) return
    // The first input is shown at once; later ones wait for the selection
    // to settle.
    const delay = loadedOnce.current ? HOVER_CARD_WINDOW_INPUT_DEBOUNCE_MS : 0
    loadedOnce.current = true
    const timer = window.setTimeout(() => load(text, pageLang), delay)
    return () => window.clearTimeout(timer)
  }, [providerId, text, pageLang, load])

  // A click in this window is a user activation, which allows a model download.
  const retry = needsLoad(state) ? () => load(text, pageLang) : undefined

  return (
    <themeContext.Provider value={theme}>
      <main className={cn(css.window, "bg-background")}>
        {text && <p className={css.source}>{text}</p>}
        {retry ? (
          <button type="button" className={css.retryButton} onClick={retry}>
            <HoverCardBody state={state} />
          </button>
        ) : state.status === "empty" ? (
          <p className={css.message}>{t("HoverCard_empty")}</p>
        ) : (
          <HoverCardBody state={state} />
        )}
      </main>
    </themeContext.Provider>
  )
}
