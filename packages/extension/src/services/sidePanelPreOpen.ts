import { OPEN_MODE, PAGE_ACTION_OPEN_MODE } from "@/const"
import type { Command } from "@/types"
import { isAiPromptCommand, isPageActionCommand } from "@/lib/commandGuards"
import { closeSidePanel } from "@/services/chrome"
import {
  isSidePanelSupported,
  getSidePanelEvent,
} from "@/services/sidePanelSupport"
import { ServiceWorkerData } from "@/services/serviceWorkerData"
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
 *
 * When the side panel of the tab is already open, it is kept as is, so the
 * shown page is not lost if the command does not run after all.
 */

/**
 * How long a pre-opened side panel waits for the openSidePanel request.
 * After that, the panel is closed so a blank panel is not left open when
 * the command fails or is skipped. Long enough for a permission prompt
 * (e.g. reading the clipboard) shown while the command runs.
 */
const PRE_OPEN_TIMEOUT_MS = 30000

/**
 * Blank page shown until the target page is set. The relay page does
 * nothing without the url parameter.
 */
const PLACEHOLDER_PATH = SIDE_PANEL_RELAY_PATH

type PreOpened = {
  /** Timer that gives up waiting for the openSidePanel request. */
  timer: ReturnType<typeof setTimeout>
  /** False if the side panel was already open, so it must not be closed. */
  closeOnCancel: boolean
}

// Tab ID → the pre-opened state.
const preOpenedTabs = new Map<number, PreOpened>()

// Tab ID → counter incremented whenever the side panel of the tab is about
// to be opened. Used to skip a delayed close for an older pre-open.
const openGenerations = new Map<number, number>()

const nextGeneration = (tabId: number): number => {
  const generation = (openGenerations.get(tabId) ?? 0) + 1
  openGenerations.set(tabId, generation)
  return generation
}

/**
 * Check whether the side panel of the tab is known to be open.
 * sidePanelTabs tells it only when onClosed is available, because otherwise
 * a side panel closed by the user is never removed from it.
 */
const isSidePanelOpen = (tabId: number): boolean => {
  if (!getSidePanelEvent("onClosed")) return false
  return ServiceWorkerData.get().sidePanelTabs.some((t) => t.tabId === tabId)
}

/**
 * Close the side panel opened by a pre-open that was not used.
 * The close is skipped when the side panel of the tab is opened again while
 * closing, as closeSidePanel disables the panel after its close animation.
 */
const closePreOpened = (tabId: number, state: PreOpened): void => {
  if (!state.closeOnCancel) return
  const generation = openGenerations.get(tabId)
  closeSidePanel(tabId, () => openGenerations.get(tabId) === generation)
}

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

  clearPreOpened(tabId)
  nextGeneration(tabId)
  const alreadyOpen = isSidePanelOpen(tabId)

  const state: PreOpened = {
    timer: setTimeout(() => {
      // The command did not request the side panel in time.
      if (preOpenedTabs.get(tabId) === state) {
        preOpenedTabs.delete(tabId)
        console.warn("Close the pre-opened side panel:", tabId)
        closePreOpened(tabId, state)
      }
    }, PRE_OPEN_TIMEOUT_MS),
    closeOnCancel: !alreadyOpen,
  }
  preOpenedTabs.set(tabId, state)

  // Keep the shown page. The later request only sets the target page.
  if (alreadyOpen) return

  // Do not await: open() must be called within the user gesture.
  chrome.sidePanel
    .setOptions({ tabId, path: PLACEHOLDER_PATH, enabled: true })
    .catch((e) => console.warn("Failed to set the side panel options:", e))

  chrome.sidePanel.open({ tabId }).catch((e) => {
    console.error("Failed to pre-open the side panel:", e)
    // Clear only the state of this call. A later pre-open of the same tab
    // may have replaced it before this rejection arrived.
    if (preOpenedTabs.get(tabId) === state) {
      clearPreOpened(tabId)
    }
  })
}

/**
 * Take the pre-opened state of the tab.
 * Call this whenever the side panel of the tab is about to be opened, even
 * when it was not pre-opened, so a delayed close of an older pre-open does
 * not disable the new side panel.
 * @param {number} tabId - The tab that requests the side panel.
 * @returns {boolean} True if the side panel was pre-opened for the tab, so
 * calling open() again is not needed.
 */
export const consumePreOpenedSidePanel = (tabId: number): boolean => {
  nextGeneration(tabId)
  return clearPreOpened(tabId) != null
}

/**
 * Close the pre-opened side panel when the command is not run after all.
 * @param {number} tabId - The tab the side panel was pre-opened for.
 */
export const cancelPreOpenedSidePanel = (tabId: number): void => {
  const state = clearPreOpened(tabId)
  if (state) closePreOpened(tabId, state)
}

const clearPreOpened = (tabId: number): PreOpened | undefined => {
  const state = preOpenedTabs.get(tabId)
  if (state === undefined) return undefined
  clearTimeout(state.timer)
  preOpenedTabs.delete(tabId)
  return state
}

/** Reset internal state. */
const resetPreOpenedSidePanels = (): void => {
  preOpenedTabs.forEach((state) => clearTimeout(state.timer))
  preOpenedTabs.clear()
  openGenerations.clear()
}

/** Test-only exports. Do not use in production code. */
export const __test = {
  resetPreOpenedSidePanels,
  PRE_OPEN_TIMEOUT_MS,
}
