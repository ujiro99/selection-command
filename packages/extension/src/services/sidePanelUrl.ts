import { Storage, LOCAL_STORAGE_KEY } from "@/services/storage"

/**
 * Resolves the value passed to chrome.sidePanel.setOptions({ path }) when a
 * web page should be shown in the side panel.
 *
 * The `path` option is documented as a resource inside the extension package,
 * but browsers differ in how they treat an absolute URL:
 * - Chrome resolves it as a URL, so passing "https://..." shows the web page.
 *   However, Chrome blocks a side panel extension page from navigating itself
 *   to a web URL.
 * - Vivaldi appends it to the extension origin
 *   ("chrome-extension://<id>/https://..."), which results in
 *   ERR_FILE_NOT_FOUND. On the other hand, navigation from an extension page
 *   to a web URL is allowed there.
 *
 * To support both, the side panel first opens a relay page bundled with the
 * extension (see side_panel_relay.ts). The relay page navigates to the target
 * URL when it can, and otherwise asks the service worker to set the URL as
 * `path` directly. Once the direct mode is detected, it is cached so later
 * calls skip the relay page.
 */

/** Path of the relay page inside the extension package. */
export const SIDE_PANEL_RELAY_PATH = "src/side_panel_relay.html"

/** Query parameter names used by the relay page. */
export const RELAY_PARAM = {
  URL: "url",
  TAB_ID: "tabId",
} as const

/**
 * Whether the browser accepts a web URL as `path` directly.
 * Kept in memory because setOptions must be called synchronously to keep the
 * user gesture for chrome.sidePanel.open().
 */
let directUrlSupported = false

/**
 * Load the cached detection result. Call once when the service worker starts.
 */
export const initSidePanelUrlMode = async (): Promise<void> => {
  try {
    const cached = await Storage.get<boolean | undefined>(
      LOCAL_STORAGE_KEY.SIDE_PANEL_DIRECT_URL,
    )
    // Do not overwrite a result detected while the storage was being read.
    directUrlSupported = directUrlSupported || cached === true
  } catch (e) {
    console.warn("Failed to load side panel URL mode:", e)
  }
}

/**
 * Remember that the browser accepts a web URL as `path` directly.
 */
export const markDirectUrlSupported = async (): Promise<void> => {
  if (directUrlSupported) return
  directUrlSupported = true
  try {
    await Storage.set(LOCAL_STORAGE_KEY.SIDE_PANEL_DIRECT_URL, true)
  } catch (e) {
    console.warn("Failed to save side panel URL mode:", e)
  }
}

/**
 * Build the relay page path that navigates to the given URL.
 * @param {string} url - The web URL to show in the side panel.
 * @param {number} tabId - The tab the side panel belongs to.
 * @returns {string} The relay page path with query parameters.
 */
export const buildRelayPath = (url: string, tabId: number): string => {
  const params = new URLSearchParams({
    [RELAY_PARAM.URL]: url,
    [RELAY_PARAM.TAB_ID]: String(tabId),
  })
  return `${SIDE_PANEL_RELAY_PATH}?${params.toString()}`
}

/**
 * Get the value to pass as `path` to chrome.sidePanel.setOptions.
 * @param {string} url - The web URL to show in the side panel.
 * @param {number} tabId - The tab the side panel belongs to.
 * @returns {string} The URL itself in direct mode or when it is not a web
 * URL, otherwise the relay path.
 */
export const toSidePanelPath = (url: string, tabId: number): string => {
  if (directUrlSupported || !isRelayableUrl(url)) return url
  return buildRelayPath(url, tabId)
}

/**
 * Check whether the URL can be shown in the side panel via the relay page.
 * Only http(s) URLs are accepted to avoid navigating to arbitrary schemes.
 * @param {string | null} url - The URL to check.
 * @returns {boolean} True if the URL is an http(s) URL.
 */
export const isRelayableUrl = (url: string | null): url is string => {
  if (!url) return false
  try {
    const { protocol } = new URL(url)
    return protocol === "http:" || protocol === "https:"
  } catch {
    return false
  }
}

/** Test-only exports. Do not use in production code. */
export const __test = {
  reset: () => {
    directUrlSupported = false
  },
}
