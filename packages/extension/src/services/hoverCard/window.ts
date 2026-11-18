import { BaseStorage } from "@/services/storage/index"
import { SESSION_STORAGE_KEY } from "@/services/storage/const"
import type { HoverCardProviderId } from "@/types"

/**
 * A hover card reopened as a separate window ("Keep").
 * The window stays open and follows the selection on web pages.
 */

export const HOVER_CARD_WINDOW_PATH = "src/hover_card_window.html"
export const HOVER_CARD_WINDOW_WIDTH = 420
export const HOVER_CARD_WINDOW_HEIGHT = 320

// Wait until the selection settles before running the provider again.
export const HOVER_CARD_WINDOW_INPUT_DEBOUNCE_MS = 300

/**
 * Shared state of the window, kept in session storage.
 * Content scripts update the input; the window page renders it.
 * null while no window is open.
 */
export type HoverCardWindowState = {
  /** null until the window is created. */
  windowId: number | null
  providerId: HoverCardProviderId
  /** Command title, used as the window title. */
  title: string
  text: string
  /** Language of the page the text was selected on. */
  pageLang?: string
}

export type HoverCardWindowInput = Omit<HoverCardWindowState, "windowId">

export type OpenHoverCardWindowProps = HoverCardWindowInput & {
  top: number
  left: number
}

const KEY = SESSION_STORAGE_KEY.HOVER_CARD_WINDOW

export const HoverCardWindowStore = {
  get: () => BaseStorage.get<HoverCardWindowState | null>(KEY),
  set: (state: HoverCardWindowState | null) => BaseStorage.set(KEY, state),
  subscribe: (cb: (state: HoverCardWindowState | null) => void) =>
    BaseStorage.addListener<HoverCardWindowState | null>(
      KEY,
      (v: HoverCardWindowState | null) => cb(v ?? null),
    ),

  /**
   * Replace the input text of the open window.
   * Does nothing when no window is open or the text is unchanged.
   */
  async updateInput(text: string, pageLang?: string): Promise<void> {
    const state = await HoverCardWindowStore.get()
    if (state == null || state.text === text) return
    await HoverCardWindowStore.set({ ...state, text, pageLang })
  },
}
