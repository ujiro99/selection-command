import { BgData } from "@/services/backgroundData"
import { windowExists } from "@/services/chrome"

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

export async function updateActiveScreenId(windowId: number): Promise<void> {
  try {
    const exists = await windowExists(windowId)
    if (!exists) {
      console.warn(`Window ${windowId} does not exist for screen ID update`)
      return
    }

    const window = await chrome.windows.get(windowId)
    const left = window.left ?? 0
    const top = window.top ?? 0

    // Find the display that contains the window
    const displays = await chrome.system.display.getInfo()
    const display = displays.find((d) => {
      return (
        left >= d.bounds.left &&
        left < d.bounds.left + d.bounds.width &&
        top >= d.bounds.top &&
        top < d.bounds.top + d.bounds.height
      )
    })

    if (display) {
      // Update BgData with the active screen ID
      await BgData.set((data) => ({
        ...data,
        activeScreenId: display.id,
      }))
    }
  } catch (error) {
    console.error("Failed to update active screen ID:", error)
  }
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
  try {
    // For background_script.ts
    const displays = await chrome.system.display.getInfo()
    const activeScreenId = BgData.get().activeScreenId

    // Use the screen with active screen ID if it exists,
    // otherwise use the primary display
    const targetDisplay = activeScreenId
      ? displays.find((d) => d.id === activeScreenId)
      : displays.find((d) => d.isPrimary)

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
    // For tabs
    return {
      width: window.screen.width,
      height: window.screen.height,
      left: (window.screen as any).availLeft ?? 0,
      top: (window.screen as any).availTop ?? 0,
    }
  }
}
