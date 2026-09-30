/**
 * Feature detection for the chrome.sidePanel API.
 *
 * Some Chromium-based browsers (e.g. Opera) do not provide chrome.sidePanel.
 * Side panel features are treated as an optional capability, so every caller
 * must check availability before touching the API.
 * No fallback to browser specific APIs (e.g. Opera's sidebarAction) is done.
 */

const getSidePanel = (): typeof chrome.sidePanel | undefined => {
  try {
    return typeof chrome !== "undefined" ? chrome.sidePanel : undefined
  } catch {
    return undefined
  }
}

/**
 * Check whether the side panel API required to open a panel is available.
 * @returns {boolean} True if chrome.sidePanel.open and setOptions exist.
 */
export const isSidePanelSupported = (): boolean => {
  const sidePanel = getSidePanel()
  return (
    typeof sidePanel?.open === "function" &&
    typeof sidePanel?.setOptions === "function"
  )
}

/**
 * Check whether chrome.sidePanel.close is available.
 * close() was added later than open(), so it is detected separately.
 * @returns {boolean} True if chrome.sidePanel.close exists.
 */
export const isSidePanelCloseSupported = (): boolean => {
  return typeof getSidePanel()?.close === "function"
}

type SidePanelEventName = "onOpened" | "onClosed"

/**
 * Get a side panel event if it is available in the current environment.
 * @param {SidePanelEventName} name - The event name.
 * @returns The event object, or undefined if not supported.
 */
export const getSidePanelEvent = <T extends SidePanelEventName>(
  name: T,
): (typeof chrome.sidePanel)[T] | undefined => {
  const event = getSidePanel()?.[name]
  return typeof event?.addListener === "function" ? event : undefined
}
