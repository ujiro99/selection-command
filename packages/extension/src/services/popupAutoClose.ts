import { Settings } from "@/services/settings/settings"
import { closeWindow } from "@/services/chrome"
import { WindowStackManager } from "@/services/windowStackManager"
import type { WindowType } from "@/types"

/**
 * Popup Auto-Close Manager
 * Manages automatic closing of popup windows with configurable delay
 */
export class PopupAutoClose {
  private static timer: NodeJS.Timeout | null = null

  /**
   * Cancel any pending auto-close timer
   */
  static cancelTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  /**
   * Schedule popup windows to close with configured delay
   * @param windowsToClose - Array of windows to close
   * @returns Promise that resolves when windows are closed or timer is set
   */
  static async scheduleClose(windowsToClose: WindowType[]): Promise<void> {
    // Cancel any existing timer first
    this.cancelTimer()

    // If no windows to close, nothing to do
    if (windowsToClose.length === 0) {
      return
    }

    // Get the auto-close delay setting
    const settings = await Settings.get()
    const autoCloseDelay = settings.popupAutoCloseDelay

    // Define the close function
    const closeWindows = async () => {
      for (const window of windowsToClose) {
        await closeWindow(window.id, "onFocusChanged")
        await WindowStackManager.removeWindow(window.id)
      }
      this.timer = null
    }

    // Execute close based on delay setting
    if (autoCloseDelay !== undefined && autoCloseDelay > 0) {
      // Delayed close: Set timeout
      this.timer = setTimeout(closeWindows, autoCloseDelay)
    } else {
      // Immediate close: No delay configured
      await closeWindows()
    }
  }
}
