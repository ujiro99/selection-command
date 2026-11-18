import { logHoverCard } from "./log"

/**
 * Normalize a BCP 47 tag to the form the Translator API expects.
 * The API uses base language codes, except for Traditional Chinese ("zh-Hant").
 */
export function toTranslatorLanguage(tag: string): string {
  const parts = tag.replace("_", "-").split("-")
  const base = parts[0].toLowerCase()
  if (base === "zh") {
    const rest = parts.slice(1).map((p) => p.toLowerCase())
    const isTraditional = rest.some((p) =>
      ["hant", "tw", "hk", "mo"].includes(p),
    )
    return isTraditional ? "zh-Hant" : "zh"
  }
  return base
}

export type DetectedLanguage = {
  language: string
  source: "chrome.i18n" | "LanguageDetector" | "pageLang"
}

type I18nDetection = { language: string; confident: boolean }

// CLD often reports isReliable: false even for a clear sentence,
// so a dominant language share is also treated as confident.
const CONFIDENT_PERCENTAGE = 80

const detectWithI18n = (text: string): Promise<I18nDetection | null> =>
  new Promise((resolve) => {
    if (!chrome?.i18n?.detectLanguage) return resolve(null)
    chrome.i18n.detectLanguage(text, (result) => {
      logHoverCard(
        "chrome.i18n.detectLanguage:",
        JSON.stringify({ text: text.slice(0, 60), result }),
      )
      const top = result?.languages?.[0]
      // "und" means undetermined.
      if (top && top.language !== "und") {
        resolve({
          language: top.language,
          confident:
            result.isReliable || top.percentage >= CONFIDENT_PERCENTAGE,
        })
      } else {
        resolve(null)
      }
    })
  })

const detectWithBuiltinAi = async (
  text: string,
  signal: AbortSignal,
): Promise<string | null> => {
  if (typeof LanguageDetector === "undefined") return null
  // Only use it when ready; creating it otherwise may need a user gesture.
  if ((await LanguageDetector.availability()) !== "available") return null
  const detector = await LanguageDetector.create({ signal })
  try {
    const [top] = await detector.detect(text, { signal })
    return top && top.detectedLanguage !== "und" ? top.detectedLanguage : null
  } finally {
    detector.destroy()
  }
}

/**
 * Detect the language of the text.
 * chrome.i18n.detectLanguage (CLD) needs no model download, so try it first.
 * When it is unsure, prefer LanguageDetector, then the page language.
 */
export async function detectLanguage(
  text: string,
  signal: AbortSignal,
  pageLang?: string,
): Promise<DetectedLanguage | null> {
  const i18n = await detectWithI18n(text)
  if (i18n?.confident) return { language: i18n.language, source: "chrome.i18n" }
  // CLD is often unsure about short text such as a single word.
  const ai = await detectWithBuiltinAi(text, signal).catch(() => null)
  if (ai) return { language: ai, source: "LanguageDetector" }
  // A short selection is most likely in the page's language.
  if (pageLang) return { language: pageLang, source: "pageLang" }
  // Fall back to the best guess, as SelectON does.
  if (i18n) return { language: i18n.language, source: "chrome.i18n" }
  return null
}
