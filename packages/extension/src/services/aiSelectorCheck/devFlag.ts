/**
 * Developer settings, stored in localStorage of the options page (the
 * extension origin) so that they are never synced or exported with the
 * user's settings. Set them from the DevTools console of the options page:
 *
 *   localStorage.setItem("selectionCommand.devTools", "true")
 *   localStorage.setItem("selectionCommand.geminiApiKey", "<API key>")
 */
export const DEV_TOOLS_FLAG_KEY = "selectionCommand.devTools"
export const GEMINI_API_KEY_KEY = "selectionCommand.geminiApiKey"

const getItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export const isDevToolsEnabled = (): boolean =>
  getItem(DEV_TOOLS_FLAG_KEY) === "true"

/** Gemini API key for page classification (optional). */
export const getGeminiApiKey = (): string | undefined =>
  getItem(GEMINI_API_KEY_KEY) || undefined
