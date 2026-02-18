import { BgData } from "@/services/backgroundData"

/**
 * Detect if the current context is a side panel.
 * The tabId should be obtained from TabContextProvider which handles the
 * fallback for side panel context (where Ipc.getTabId may not work).
 * @param {number | undefined} tabId - The tab ID from context
 * @param {number | undefined} activeTabId - The active tab ID from Ipc
 * @returns {boolean} True if the current context is a side panel
 */
export const isSidePanel = (
  tabId: number | null | undefined,
  activeTabId: number | null | undefined,
): boolean => {
  if (tabId != null) return false // In sidePanel, tabId is null.
  if (!activeTabId) return false

  // Check if tab is in sidePanelTabs
  const bgData = BgData.get()
  if (!bgData.sidePanelTabs.includes(activeTabId)) return false

  return true
}
