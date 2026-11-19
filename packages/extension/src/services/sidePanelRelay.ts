import { Ipc, ServiceWorkerCommand } from "@/services/ipc"
import type { SidePanelRelayFallbackProps } from "@/services/chrome"
import {
  RELAY_PARAM,
  isRelayableUrl,
  isValidTabId,
} from "@/services/sidePanelUrl"

/**
 * Relay page opened in the side panel before showing a web page.
 * See services/sidePanelUrl.ts for why this page is needed. The entry point
 * is side_panel_relay.ts.
 *
 * - When the side panel is hosted as a tab (e.g. Vivaldi), navigating this
 *   page to the web URL is allowed, so it navigates by itself. Before that, it
 *   registers the tab to the service worker so that the content script of the
 *   web page is treated as a side panel (e.g. to run page actions).
 * - Otherwise (e.g. Chrome), navigation from an extension side panel page to a
 *   web URL is blocked silently, so it asks the service worker to set the URL
 *   as the side panel path directly.
 *
 * @param {string} search - The query string of the relay page.
 * @param {(url: string) => void} navigate - Navigates this page to the URL.
 * @returns {Promise<void>} A promise that resolves when the relay is done.
 */
export const relay = async (
  search: string,
  navigate: (url: string) => void,
): Promise<void> => {
  const params = new URLSearchParams(search)
  const url = params.get(RELAY_PARAM.URL)
  const tabIdParam = params.get(RELAY_PARAM.TAB_ID)
  // Number(null) and Number("") are 0, so check the presence first.
  const tabId = tabIdParam ? Number(tabIdParam) : NaN

  if (!isRelayableUrl(url)) {
    console.warn("[sidePanelRelay] Invalid URL:", url)
    return
  }

  // Chrome returns undefined because its side panel is not a tab.
  const currentTab = await chrome.tabs.getCurrent()
  if (currentTab != null) {
    try {
      await Ipc.send(ServiceWorkerCommand.registerSidePanelHostTab)
    } catch (e) {
      // Still show the page even if the registration fails.
      console.error("[sidePanelRelay] Failed to register the host tab:", e)
    }
    navigate(url)
    return
  }

  if (!isValidTabId(tabId)) {
    console.warn("[sidePanelRelay] Invalid tab ID:", tabIdParam)
    return
  }

  await Ipc.send<SidePanelRelayFallbackProps>(
    ServiceWorkerCommand.sidePanelRelayFallback,
    { url, tabId },
  )
}
