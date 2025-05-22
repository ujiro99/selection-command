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
    if (typeof chrome !== 'undefined' && chrome.windows) {
      const currentWindow = await chrome.windows.getCurrent()
      top = currentWindow.top ?? 0
      left = currentWindow.left ?? 0
    } else {
      top = window.screenTop
      left = window.screenLeft
    }
  } catch (error) {
    console.warn('Failed to get window position:', error)
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
    const primaryDisplay = displays.find((d) => d.isPrimary)

    if (!primaryDisplay) {
      throw new Error('Primary display not found')
    }

    return {
      width: primaryDisplay.bounds.width,
      height: primaryDisplay.bounds.height,
      left: primaryDisplay.bounds.left,
      top: primaryDisplay.bounds.top,
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
