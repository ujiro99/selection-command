import { Ipc, ServiceWorkerCommand } from "@/services/ipc"
import type { SidePanelRelayFallbackProps } from "@/services/chrome"
import { RELAY_PARAM, isRelayableUrl } from "@/services/sidePanelUrl"

/**
 * Relay page opened in the side panel before showing a web page.
 * See services/sidePanelUrl.ts for why this page is needed.
 *
 * - When the side panel is hosted as a tab (e.g. Vivaldi), navigating this
 *   page to the web URL is allowed, so it navigates by itself.
 * - Otherwise (e.g. Chrome), navigation from an extension side panel page to a
 *   web URL is blocked silently, so it asks the service worker to set the URL
 *   as the side panel path directly.
 */
const relay = async (): Promise<void> => {
  const params = new URLSearchParams(location.search)
  const url = params.get(RELAY_PARAM.URL)
  const tabId = Number(params.get(RELAY_PARAM.TAB_ID))

  if (!isRelayableUrl(url)) {
    console.warn("[sidePanelRelay] Invalid URL:", url)
    return
  }

  // Chrome returns undefined because its side panel is not a tab.
  const currentTab = await chrome.tabs.getCurrent()
  if (currentTab != null) {
    location.replace(url)
    return
  }

  await Ipc.send<SidePanelRelayFallbackProps>(
    ServiceWorkerCommand.sidePanelRelayFallback,
    { url, tabId },
  )
}

relay().catch((e) => {
  console.error("[sidePanelRelay] Failed:", e)
})
