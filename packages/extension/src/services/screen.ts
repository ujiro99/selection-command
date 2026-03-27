import { isServiceWorker } from "@/lib/utils"

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

export async function getScreenSize(): Promise<ScreenSize> {
  if (isServiceWorker()) {
    try {
      // For background_script.ts
      const [displays, currentWindow] = await Promise.all([
        chrome.system.display.getInfo(),
        chrome.windows.getCurrent(),
      ])

      let targetDisplay
      const currentWindowLeft = currentWindow.left
      const currentWindowTop = currentWindow.top

      if (currentWindowLeft != null && currentWindowTop != null) {
        // Find the monitor that contains the active window's left position
        targetDisplay =
          displays.find((d) => {
            const a = d.workArea
            return (
              currentWindowLeft >= a.left &&
              currentWindowLeft < a.left + a.width &&
              currentWindowTop >= a.top &&
              currentWindowTop < a.top + a.height
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
      return {
        width: 0,
        height: 0,
        left: 0,
        top: 0,
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
