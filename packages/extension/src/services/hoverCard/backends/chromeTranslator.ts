import { HoverCardError, type HoverCardBackend } from "../types"
import { detectLanguage, toTranslatorLanguage } from "../language"
import { logHoverCard } from "../log"
import type {
  TranslateInput,
  TranslateOutput,
} from "../providers/translateTypes"

// Translator instances are reused per language pair; creating one is costly.
const translators = new Map<string, Promise<AITranslator>>()

const isNotAllowed = (e: unknown): boolean =>
  e instanceof DOMException && e.name === "NotAllowedError"

// Fail when the download makes no progress, instead of loading forever.
export const CREATE_STALL_TIMEOUT_MS = 15_000

async function getTranslator(
  sourceLanguage: string,
  targetLanguage: string,
  onProgress?: (fraction: number) => void,
): Promise<AITranslator> {
  const key = `${sourceLanguage}>${targetLanguage}`
  const cached = translators.get(key)
  if (cached) return cached

  const promise = new Promise<AITranslator>((resolve, reject) => {
    let timer = 0
    const armTimer = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        reject(new HoverCardError("failed", "Model download stalled"))
      }, CREATE_STALL_TIMEOUT_MS)
    }
    armTimer()
    Translator!
      .create({
        sourceLanguage,
        targetLanguage,
        monitor(m) {
          m.addEventListener("downloadprogress", (e) => {
            logHoverCard("download progress", key, e.loaded)
            armTimer()
            onProgress?.(e.loaded)
          })
        },
      })
      .then(resolve, reject)
      .finally(() => window.clearTimeout(timer))
  })
  translators.set(key, promise)
  // Drop failed attempts so that a later click (user activation) can retry.
  promise.catch(() => translators.delete(key))
  return promise
}

/**
 * On-device translation with Chrome's built-in Translator API.
 * Runs in the content script; the text never leaves the device.
 */
export const chromeTranslatorBackend: HoverCardBackend<
  TranslateInput,
  TranslateOutput
> = {
  id: "chromeTranslator",

  async isAvailable() {
    const available = typeof Translator !== "undefined"
    logHoverCard("Translator API exposed:", available, {
      languageDetector: typeof LanguageDetector !== "undefined",
    })
    return available
  },

  async run(input, { signal, ctx }) {
    const detected = await detectLanguage(input.text, signal)
    logHoverCard("detected language:", detected)
    if (!detected) {
      throw new HoverCardError("unsupported", "Source language not detected")
    }

    const sourceLanguage = toTranslatorLanguage(detected.language)
    const targetLanguage = toTranslatorLanguage(ctx.uiLanguage)
    if (sourceLanguage === targetLanguage) {
      throw new HoverCardError("notApplicable", "Already in user's language")
    }

    const availability = await Translator!.availability({
      sourceLanguage,
      targetLanguage,
    })
    logHoverCard("availability:", `${sourceLanguage}>${targetLanguage}`, {
      availability,
      userActivation: JSON.stringify({
        isActive: navigator.userActivation?.isActive,
        hasBeenActive: navigator.userActivation?.hasBeenActive,
      }),
    })
    if (availability === "unavailable") {
      throw new HoverCardError(
        "unsupported",
        `Pair not supported: ${sourceLanguage}>${targetLanguage}`,
      )
    }

    let translator: AITranslator
    try {
      translator = await getTranslator(
        sourceLanguage,
        targetLanguage,
        ctx.onProgress,
      )
    } catch (e) {
      logHoverCard("create() failed:", e)
      if (e instanceof HoverCardError) throw e
      if (isNotAllowed(e)) {
        throw new HoverCardError("needsActivation", String(e), { cause: e })
      }
      throw new HoverCardError("failed", String(e), { cause: e })
    }

    const started = performance.now()
    const text = await translator.translate(input.text, { signal })
    logHoverCard("translated in", Math.round(performance.now() - started), "ms")

    return { text, sourceLanguage, targetLanguage }
  },
}
