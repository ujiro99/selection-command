import { OPEN_MODE, PAGE_ACTION_OPEN_MODE } from "@/const"
import type { Command } from "@/types"
import { isAiPromptCommand, isPageActionCommand } from "@/lib/commandGuards"
import { closeSidePanel } from "@/services/chrome"
import { isSidePanelSupported } from "@/services/sidePanelSupport"
import { SIDE_PANEL_RELAY_PATH } from "@/services/sidePanelUrl"

/**
 * Opens the side panel ahead of a command started from a browser UI event
 * (the native context menu or a keyboard shortcut).
 *
 * chrome.sidePanel.open() must be called while the user gesture is alive.
 * A command started from those events is sent to the content script and
 * then asks the service worker to open the side panel, but by then the
 * gesture is lost: unlike a click on the page, the browser UI does not give
 * the page a user activation. So the service worker opens the side panel
 * with a blank page synchronously in the event handler, and the later
 * openSidePanel request only sets the target page (see
 * ActionHelper.openSidePanel).
 */

/**
 * How long a pre-opened side panel waits for the openSidePanel request.
 * After that, the panel is closed so a blank panel is not left open when
 * the command fails or is skipped.
 */
const PRE_OPEN_TIMEOUT_MS = 10000

/**
 * Blank page shown until the target page is set. The relay page does
 * nothing without the url parameter.
 */
const PLACEHOLDER_PATH = SIDE_PANEL_RELAY_PATH

// Tab ID → timer that closes the pre-opened side panel.
const preOpenedTabs = new Map<number, ReturnType<typeof setTimeout>>()

/**
 * Check whether the command shows its result in the side panel.
 * @param {Command} command - The command to check.
 * @returns {boolean} True if the command opens the side panel.
 */
export const usesSidePanel = (command: Command): boolean => {
  if (isAiPromptCommand(command)) {
    return command.aiPromptOption?.openMode === OPEN_MODE.SIDE_PANEL
  }
  if (isPageActionCommand(command)) {
    return (
      command.pageActionOption?.openMode === PAGE_ACTION_OPEN_MODE.SIDE_PANEL
    )
  }
  return command.openMode === OPEN_MODE.SIDE_PANEL
}

/**
 * Open the side panel of the tab with a blank page.
 * Must be called synchronously in the browser UI event handler, before any
 * await, to keep the user gesture.
 * @param {number} tabId - The tab to open the side panel for.
 */
export const preOpenSidePanel = (tabId: number): void => {
  if (!isSidePanelSupported()) return

  // Do not await: open() must be called within the user gesture.
  chrome.sidePanel
    .setOptions({ tabId, path: PLACEHOLDER_PATH, enabled: true })
    .catch((e) => console.warn("Failed to set the side panel options:", e))

  clearPreOpened(tabId)
  const timer = setTimeout(() => {
    // The command did not request the side panel in time.
    if (preOpenedTabs.delete(tabId)) {
      console.warn("Close the pre-opened side panel:", tabId)
      closeSidePanel(tabId)
    }
  }, PRE_OPEN_TIMEOUT_MS)
  preOpenedTabs.set(tabId, timer)

  chrome.sidePanel.open({ tabId }).catch((e) => {
    console.error("Failed to pre-open the side panel:", e)
    // Clear only the state of this call. A later pre-open of the same tab
    // may have replaced it before this rejection arrived.
    if (preOpenedTabs.get(tabId) === timer) {
      clearPreOpened(tabId)
    }
  })
}

/**
 * Take the pre-opened state of the tab.
 * @param {number} tabId - The tab that requests the side panel.
 * @returns {boolean} True if the side panel was pre-opened for the tab, so
 * calling open() again is not needed.
 */
export const consumePreOpenedSidePanel = (tabId: number): boolean => {
  return clearPreOpened(tabId)
}

/**
 * Close the pre-opened side panel when the command is not run after all.
 * @param {number} tabId - The tab the side panel was pre-opened for.
 */
export const cancelPreOpenedSidePanel = (tabId: number): void => {
  if (clearPreOpened(tabId)) {
    closeSidePanel(tabId)
  }
}

const clearPreOpened = (tabId: number): boolean => {
  const timer = preOpenedTabs.get(tabId)
  if (timer === undefined) return false
  clearTimeout(timer)
  preOpenedTabs.delete(tabId)
  return true
}

/** Reset internal state. */
const resetPreOpenedSidePanels = (): void => {
  preOpenedTabs.forEach((timer) => clearTimeout(timer))
  preOpenedTabs.clear()
}

/** Test-only exports. Do not use in production code. */
export const __test = {
  resetPreOpenedSidePanels,
  PRE_OPEN_TIMEOUT_MS,
}
