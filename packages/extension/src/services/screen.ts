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

export async function getScreenSize(hint?: {
  top: number
  left: number
}): Promise<ScreenSize> {
  if (isServiceWorker()) {
    try {
      // For background_script.ts
      const displays = await chrome.system.display.getInfo()

      let hintTop = hint?.top
      let hintLeft = hint?.left

      if (hintTop == null || hintLeft == null) {
        // Fall back to current window position if no hint provided
        const currentWindow = await chrome.windows.getCurrent()
        hintLeft = currentWindow.left ?? undefined
        hintTop = currentWindow.top ?? undefined
      }

      let targetDisplay
      if (hintLeft != null && hintTop != null) {
        // Find the monitor that contains the given position
        targetDisplay =
          displays.find((d) => {
            const a = d.workArea
            return (
              hintLeft >= a.left &&
              hintLeft < a.left + a.width &&
              hintTop >= a.top &&
              hintTop < a.top + a.height
            )
          }) ??
          displays.find((d) => d.isPrimary) ??
          displays[0]
      } else {
        // If left/top cannot be retrieved, prefer returning the primary monitor
        targetDisplay = displays.find((d) => d.isPrimary) ?? displays[0]
      }

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
