import { Settings } from "@/services/settings/settings"
import { enhancedSettings } from "@/services/settings/enhancedSettings"
import { Ipc, TabCommand } from "@/services/ipc"
import { COMMAND_USAGE } from "@/const"

/**
 * Increment command execution count and check review request
 */
export const incrementCommandExecutionCount = async (
  tabId?: number,
): Promise<void> => {
  try {
    const settings = await enhancedSettings.get()
    let count = settings.commandExecutionCount ?? 0
    const hasShown = settings.hasShownReviewRequest ?? false

    // Increment command execution count
    count++
    await Settings.update(
      COMMAND_USAGE.SETTING_KEY.COMMAND_EXECUTION_COUNT,
      () => count,
      true,
    )

    // Show review request when threshold is exceeded
    if (
      (count === COMMAND_USAGE.REVIEW_THRESHOLD ||
        (count > COMMAND_USAGE.REVIEW_THRESHOLD &&
          (count - COMMAND_USAGE.REVIEW_THRESHOLD) %
            COMMAND_USAGE.REVIEW_INTERVAL ===
            0)) &&
      !hasShown
    ) {
      if (!tabId) {
        const tabs = await chrome.tabs.query({ active: true })
        tabId = tabs[0]?.id
      }
      if (tabId) {
        await Ipc.ensureConnection(tabId)
        await Ipc.sendTab(tabId, TabCommand.showReviewRequest)
      }
    }
  } catch (error) {
    console.error("Failed to increment command execution count:", error)
  }
}
