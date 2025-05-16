import { Settings } from '@/services/settings'
import { Ipc, TabCommand } from '@/services/ipc'
import { COMMAND_USAGE } from '@/const'

/**
 * Increment command execution count and check review request
 */
export const incrementCommandExecutionCount = async (): Promise<void> => {
    try {
        const settings = await Settings.get()
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
        if ((count === COMMAND_USAGE.REVIEW_THRESHOLD || (count > COMMAND_USAGE.REVIEW_THRESHOLD && (count - COMMAND_USAGE.REVIEW_THRESHOLD) % COMMAND_USAGE.REVIEW_INTERVAL === 0)) && !hasShown) {
            const tabs = await chrome.tabs.query({ active: true })
            if (tabs[0]?.id) {
                await Ipc.sendTab(tabs[0].id, TabCommand.showReviewRequest)
            }
        }
    } catch (error) {
        console.error('Failed to increment command execution count:', error)
    }
} 