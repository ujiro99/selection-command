import { adjustWindowPosition } from "@/services/chrome"
import { getScreenSize } from "@/services/screen"
import { POPUP_TYPE } from "@/const"
import {
  HOVER_CARD_WINDOW_PATH,
  HOVER_CARD_WINDOW_WIDTH,
  HOVER_CARD_WINDOW_HEIGHT,
  HoverCardWindowStore,
  type OpenHoverCardWindowProps,
} from "./window"

/*
 * Service worker side of the hover card window.
 * Only one window exists at a time; opening another reuses it.
 */

const windowExists = (windowId: number): Promise<boolean> =>
  chrome.windows.get(windowId).then(
    () => true,
    () => false,
  )

export async function openHoverCardWindow(
  param: OpenHoverCardWindowProps,
): Promise<void> {
  const { top, left, ...input } = param
  const current = await HoverCardWindowStore.get()

  if (current?.windowId != null && (await windowExists(current.windowId))) {
    await HoverCardWindowStore.set({ ...current, ...input })
    await chrome.windows.update(current.windowId, { focused: true })
    return
  }

  // Write the input before creating the window, so the page can read it on load.
  await HoverCardWindowStore.set({ ...input, windowId: null })

  const width = HOVER_CARD_WINDOW_WIDTH
  const height = HOVER_CARD_WINDOW_HEIGHT
  const screen = await getScreenSize({ top, left })
  const position = adjustWindowPosition(top, left, width, height, screen)

  try {
    const w = await chrome.windows.create({
      url: chrome.runtime.getURL(HOVER_CARD_WINDOW_PATH),
      type: POPUP_TYPE.POPUP,
      width,
      height,
      ...position,
    })
    const state = await HoverCardWindowStore.get()
    if (state != null && w?.id != null) {
      await HoverCardWindowStore.set({ ...state, windowId: w.id })
    }
  } catch (e) {
    await HoverCardWindowStore.set(null)
    throw e
  }
}

/** Stop following the selection once the window is closed. */
export async function onHoverCardWindowRemoved(windowId: number) {
  const state = await HoverCardWindowStore.get()
  if (state?.windowId === windowId) {
    await HoverCardWindowStore.set(null)
  }
}
