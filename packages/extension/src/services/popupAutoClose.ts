import { enhancedSettings } from "@/services/settings/enhancedSettings"
import { CACHE_SECTIONS } from "@/services/settings/settingsCache"
import { closeWindow } from "@/services/chrome"
import { WindowStackManager } from "@/services/windowStackManager"
import type { WindowType } from "@/types"

/**
 * Popup Auto-Close Manager
 * Manages automatic closing of popup windows with configurable delay
 */
export class PopupAutoClose {
  private static timer: ReturnType<typeof setTimeout> | null = null

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
   * @param reason - Reason for closing (e.g., "onFocusChanged", "onHidden")
   * @returns Promise that resolves when windows are closed or timer is set
   */
  static async scheduleClose(
    windowsToClose: WindowType[],
    reason: string = "onFocusChanged",
  ): Promise<void> {
    // Cancel any existing timer first
    this.cancelTimer()

    // If no windows to close, nothing to do
    if (windowsToClose.length === 0) {
      return
    }

    // Get the auto-close delay setting
    const userSettings = await enhancedSettings.getSection(
      CACHE_SECTIONS.USER_SETTINGS,
    )
    const autoCloseDelay = userSettings.windowOption.popupAutoCloseDelay

    // Define the close function
    const closeWindows = async () => {
      try {
        for (const window of windowsToClose) {
          await closeWindow(window.id, reason)
          await WindowStackManager.removeWindow(window.id)
        }
      } finally {
        this.timer = null
      }
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
