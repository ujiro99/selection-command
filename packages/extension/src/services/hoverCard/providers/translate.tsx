import { chromeTranslatorBackend } from "../backends/chromeTranslator"
import { toTranslatorLanguage } from "../language"
import type { HoverCardProvider } from "../types"
import type { TranslateInput, TranslateOutput } from "./translateTypes"
import css from "@/components/hoverCard/HoverCard.module.css"

// Same limit as SelectON's live translation; longer text is slow to translate.
export const TRANSLATE_MAX_LENGTH = 500

const BACKEND_LABELS: Record<string, string> = {
  chromeTranslator: "Chrome built-in translator",
}

export const translateProvider: HoverCardProvider<
  TranslateInput,
  TranslateOutput
> = {
  id: "translate",
  trigger: "hover",

  match(selectionText) {
    const text = selectionText.trim()
    if (text.length === 0 || text.length > TRANSLATE_MAX_LENGTH) return null
    return { text }
  },

  // TODO: Add the online fallback (opt-in) and "open translation site" backends.
  backends: [chromeTranslatorBackend],

  cacheKey(input, ctx) {
    return `${toTranslatorLanguage(ctx.uiLanguage)}:${input.text}`
  },

  render(output, meta) {
    return (
      <div className={css.translate}>
        <p className={css.header}>
          {BACKEND_LABELS[meta.backendId] ?? meta.backendId} ·{" "}
          {output.sourceLanguage} → {output.targetLanguage}
        </p>
        <p className={css.body}>{output.text}</p>
      </div>
    )
  },
}
