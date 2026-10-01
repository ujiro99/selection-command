/**
 * Developer settings, stored in localStorage of the options page (the
 * extension origin) so that they are never synced or exported with the
 * user's settings. Set them from the DevTools console of the options page:
 *
 *   localStorage.setItem("selectionCommand.devTools", "true")
 *   localStorage.setItem("selectionCommand.geminiApiKey", "<API key>")
 *
 * Content scripts can't read that localStorage (theirs belongs to the web
 * page), so the dev tools flag is mirrored to chrome.storage.session, which
 * is in-memory only and cleared on browser restart.
 */
import { Storage, SESSION_STORAGE_KEY } from "@/services/storage"

const DEV_TOOLS_FLAG_KEY = "selectionCommand.devTools"
const GEMINI_API_KEY_KEY = "selectionCommand.geminiApiKey"

const getItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

/** Options page only: whether the dev tools are enabled. */
export const isDevToolsEnabled = (): boolean =>
  getItem(DEV_TOOLS_FLAG_KEY) === "true"

/** Options page only: Gemini API key for page classification (optional). */
export const getGeminiApiKey = (): string | undefined =>
  getItem(GEMINI_API_KEY_KEY) || undefined

/**
 * Options page only: mirror the dev tools flag so that content scripts see
 * it. Called when the options page opens (to turn it off after the flag was
 * removed) and before a check opens tabs.
 */
export const syncDevToolsFlag = (): Promise<boolean> =>
  Storage.set(SESSION_STORAGE_KEY.DEV_TOOLS_ENABLED, isDevToolsEnabled())

/** Content script: whether the dev tools are enabled. */
export const isDevToolsEnabledForContentScript = (): Promise<boolean> =>
  Storage.get<boolean>(SESSION_STORAGE_KEY.DEV_TOOLS_ENABLED)
