import { isServiceWorker } from "@/lib/utils"

const DEFAULT_SCREEN_WIDTH = 1280
const DEFAULT_SCREEN_HEIGHT = 800

type WindowPosition = {
  top: number
  left: number
}

export type ScreenSize = {
  width: number
  height: number
  left: number
  top: number
}

export async function getWindowPosition(): Promise<WindowPosition> {
  // Get window position
  let top = 0
  let left = 0
  try {
    if (typeof chrome !== "undefined" && chrome.windows) {
      const currentWindow = await chrome.windows.getCurrent()
      top = currentWindow.top ?? 0
      left = currentWindow.left ?? 0
    } else {
      top = window.screenTop
      left = window.screenLeft
    }
  } catch (error) {
    // Use default values if window position retrieval fails
  }
  return {
    top,
    left,
  }
}

/**
 * Calculate an offset relative to the current window that centers a popup of
 * the given size within that window.
 * The result is meant to be added to getWindowPosition(), so the popup is
 * placed on the same display as the current window.
 * @param size - Size of the popup to be opened
 * @returns Offset from the current window's top-left corner
 */
export async function getCenteredOffsetInCurrentWindow(size: {
  width: number
  height: number
}): Promise<{ x: number; y: number }> {
  // If the popup is larger than the window, use the window's center instead
  // of its top-left corner; a maximized window's top-left can lie slightly
  // outside its display (e.g. -8px on Windows), which would select a wrong
  // display. The popup is re-centered on the display by the caller anyway.
  const center = (windowLength: number, popupLength: number) =>
    Math.floor(
      windowLength > popupLength
        ? (windowLength - popupLength) / 2
        : windowLength / 2,
    )
  try {
    const w = await chrome.windows.getCurrent()
    return {
      x: center(w.width ?? 0, size.width),
      y: center(w.height ?? 0, size.height),
    }
  } catch {
    // Fall back to the window's top-left corner, which is still on the
    // same display as the current window.
    return { x: 0, y: 0 }
  }
}

export async function getScreenSize(hint?: {
  top: number
  left: number
}): Promise<ScreenSize> {
  if (isServiceWorker()) {
    try {
      // For service_worker.ts
      const displays = await chrome.system.display.getInfo()

      // Find the monitor whose work area contains the given position
      const findDisplay = (left?: number | null, top?: number | null) => {
        if (left == null || top == null) return undefined
        return displays.find((d) => {
          const a = d.workArea
          return (
            left >= a.left &&
            left < a.left + a.width &&
            top >= a.top &&
            top < a.top + a.height
          )
        })
      }

      let targetDisplay = findDisplay(hint?.left, hint?.top)

      if (!targetDisplay) {
        // The hint is missing or lies outside every display (e.g. an
        // off-screen position). Use the display of the current window so the
        // popup stays on the monitor the user is working on.
        // The window's center is used because a maximized window's top-left
        // can be slightly outside its display (e.g. -8px on Windows).
        try {
          const w = await chrome.windows.getCurrent()
          if (w.left != null && w.top != null) {
            targetDisplay = findDisplay(
              w.left + Math.floor((w.width ?? 0) / 2),
              w.top + Math.floor((w.height ?? 0) / 2),
            )
          }
        } catch {
          // Ignore and fall back to the primary display
        }
      }

      // Prefer returning the primary monitor as the last resort
      targetDisplay ??= displays.find((d) => d.isPrimary) ?? displays[0]

      if (!targetDisplay) {
        throw new Error("Target display not found")
      }

      return {
        width: targetDisplay.bounds.width,
        height: targetDisplay.bounds.height,
        left: targetDisplay.bounds.left,
        top: targetDisplay.bounds.top,
      }
    } catch (error) {
      console.warn(
        "Failed to get screen size in service worker, using fallback:",
        error,
      )
      // Fallback: use the current window's size as a minimum screen estimate
      try {
        const w = await chrome.windows.getCurrent()
        return {
          width: w.width ?? DEFAULT_SCREEN_WIDTH,
          height: w.height ?? DEFAULT_SCREEN_HEIGHT,
          left: 0,
          top: 0,
        }
      } catch (fallbackError) {
        console.warn("Fallback screen size estimation failed:", fallbackError)
        return {
          width: DEFAULT_SCREEN_WIDTH,
          height: DEFAULT_SCREEN_HEIGHT,
          left: 0,
          top: 0,
        }
      }
    }
  } else {
    return {
      width: window.screen.width,
      height: window.screen.height,
      left: (window.screen as any).availLeft ?? 0,
      top: (window.screen as any).availTop ?? 0,
    }
  }
}
