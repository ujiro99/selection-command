export type ScreenSize = {
  width: number
  height: number
  left: number
  top: number
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
