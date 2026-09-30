/**
 * Developer tools are hidden unless this flag is set from the DevTools
 * console of the options page:
 *
 *   localStorage.setItem("selectionCommand.devTools", "true")
 *
 * localStorage of the extension origin is used (not chrome.storage) so that
 * the flag is never synced or exported with the user's settings.
 */
export const DEV_TOOLS_FLAG_KEY = "selectionCommand.devTools"

export const isDevToolsEnabled = (): boolean => {
  try {
    return localStorage.getItem(DEV_TOOLS_FLAG_KEY) === "true"
  } catch {
    return false
  }
}
