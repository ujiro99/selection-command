import { BgData } from "@/services/backgroundData"

/**
 * Detect if the current context is a side panel.
 * The tabId should be obtained from TabContextProvider which handles the
 * fallback for side panel context (where Ipc.getTabId may not work).
 * @param {number | null | undefined} tabId - The tab ID from context
 * @returns {boolean} True if the current context is a side panel
 */
export const isSidePanel = (tabId: number | null | undefined): boolean => {
  if (!tabId) return false

  // Check if tab is in sidePanelTabs
  const bgData = BgData.get()
  if (!bgData.sidePanelTabs.includes(tabId)) return false

  return true
}
