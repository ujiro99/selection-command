/**
 * Minimal typings for Chrome's built-in AI APIs used by the hover card.
 * TypeScript's DOM lib does not ship these yet.
 * @see https://developer.chrome.com/docs/ai/translator-api
 * @see https://developer.chrome.com/docs/ai/language-detection
 */

type AIAvailability =
  "unavailable" | "downloadable" | "downloading" | "available"

interface AIDownloadProgressEvent extends Event {
  /** Download progress as a fraction between 0 and 1. */
  readonly loaded: number
}

interface AICreateMonitor extends EventTarget {
  addEventListener(
    type: "downloadprogress",
    listener: (e: AIDownloadProgressEvent) => void,
  ): void
}

interface AITranslatorLanguagePair {
  sourceLanguage: string
  targetLanguage: string
}

interface AITranslatorCreateOptions extends AITranslatorLanguagePair {
  monitor?: (monitor: AICreateMonitor) => void
  signal?: AbortSignal
}

interface AITranslator {
  translate(input: string, options?: { signal?: AbortSignal }): Promise<string>
  destroy(): void
}

interface AITranslatorFactory {
  availability(options: AITranslatorLanguagePair): Promise<AIAvailability>
  create(options: AITranslatorCreateOptions): Promise<AITranslator>
}

interface AILanguageDetectionResult {
  detectedLanguage: string
  confidence: number
}

interface AILanguageDetector {
  detect(
    input: string,
    options?: { signal?: AbortSignal },
  ): Promise<AILanguageDetectionResult[]>
  destroy(): void
}

interface AILanguageDetectorFactory {
  availability(): Promise<AIAvailability>
  create(options?: {
    monitor?: (monitor: AICreateMonitor) => void
    signal?: AbortSignal
  }): Promise<AILanguageDetector>
}

// eslint-disable-next-line no-var
declare var Translator: AITranslatorFactory | undefined
// eslint-disable-next-line no-var
declare var LanguageDetector: AILanguageDetectorFactory | undefined
