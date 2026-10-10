import { Storage, LOCAL_STORAGE_KEY, SESSION_STORAGE_KEY } from "./storage"
import {
  isDebug,
  isE2E,
  APP_ID,
  VERSION,
  SCREEN,
  OPEN_MODE,
  OPEN_MODE_TYPE_MAP,
  COMMAND_TYPE,
} from "@/const"
import { SessionData, HubUser } from "@/types"

const GA_ENDPOINT = "https://www.google-analytics.com/mp/collect"
const GA_DEBUG_ENDPOINT = "https://www.google-analytics.com/debug/mp/collect"
const MEASUREMENT_ID = import.meta.env.VITE_MEASUREMENT_ID
const API_SECRET = import.meta.env.VITE_API_SECRET
const DEFAULT_ENGAGEMENT_TIME_IN_MSEC = 100
const SESSION_EXPIRATION_IN_MIN = 30

// Disable analytics in CI environments or e2e builds
const IS_CI =
  typeof process !== "undefined" && process.env && process.env.CI === "true"
const DISABLE_ANALYTICS = IS_CI || isE2E

export const ANALYTICS_EVENTS = {
  INSTALLED: "installed",
  OPTION_SCREEN_OPENED: "option_screen_opened",
  HUB_SCREEN_OPENED: "hub_screen_opened",
  // Sent when a user is sent from the extension to the Hub. `event_label`
  // identifies the route (see HUB_LINK_ROUTE).
  HUB_LINK_CLICK: "hub_link_click",
  COMMAND_CREATE_SEARCH: "command_create_search",
  COMMAND_CREATE_AIPROMPT: "command_create_aiprompt",
  COMMAND_CREATE_OTHER: "command_create_other",
  HUB_ADD_SEARCH: "hub_add_search",
  HUB_ADD_AIPROMPT: "hub_add_aiprompt",
  HUB_ADD_OTHER: "hub_add_other",
  // Kept as a single event (not split by search/aiprompt/other) to stay
  // compatible with the execution-count aggregation on the Selection
  // Command Hub side, which still reads the unsplit "selection_command"
  // event name.
  SELECTION_COMMAND: "selection_command",
  LINK_COMMAND: "link_command",
  FOLDER_CREATE: "folder_create",
  PAGE_RULE_CREATE: "page_rule_create",
  SHORTCUT: "shortcut",
  SHOW_HELP: "show_help",
  SHOW_REVIEW_URL: "show_review_url",
  OPEN_DIALOG: "open_dialog",
  COMMAND_EDIT: "command_edit",
  COMMAND_REMOVE: "command_remove",
  COMMAND_SHARE: "command_share",
  // Onboarding events, used to track user progress through the onboarding flow.
  ONBOARDING_START: "onboarding_start",
  ONBOARDING_SKIP: "onboarding_skip",
  ONBOARDING_TEXT_SELECTION: "onboarding_text_selection",
  ONBOARDING_COMMAND_EXECUTE: "onboarding_command_execute",
  ONBOARDING_VALUE_REACHED: "onboarding_value_reached",
  ONBOARDING_COMPLETE: "onboarding_complete",
  // Diagnostics for the menu's icon color lookup in the service worker, which
  // the menu waits for before it renders (#482). Sent only when the lookup
  // fails or is slow, at most once per page, to keep the volume low.
  ICON_COLOR_RESOLVE_FAILED: "icon_color_resolve_failed",
  ICON_COLOR_RESOLVE_SLOW: "icon_color_resolve_slow",
  // Diagnostics for installs that never report onboarding_start (#479):
  // whether the tab was created, whether the page script ran at all, and
  // whether rendering failed.
  // TODO(#479): Remove these once the cause has been identified.
  ONBOARDING_TAB_OPENED: "onboarding_tab_opened",
  ONBOARDING_PAGE_LOADED: "onboarding_page_loaded",
  ONBOARDING_RENDER_ERROR: "onboarding_render_error",
  INSTALL_INIT_ERROR: "install_init_error",
  // No "uninstall": the service worker is gone by then, so the Hub sends it
  // from the uninstall URL instead (selection-command-hub#275).
} as const

// Routes from the extension to the Hub, used as `event_label` of HUB_LINK_CLICK.
export const HUB_LINK_ROUTE = {
  BANNER: "banner",
  LOGIN: "login",
  COMMAND_TYPE_DIALOG: "command-type-dialog",
  SHARE_BUTTON: "share-button",
  SHARE_TOAST: "share-toast",
} as const

export type HubLinkRoute = (typeof HUB_LINK_ROUTE)[keyof typeof HUB_LINK_ROUTE]

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS]

// Coarse-grained category used to group per-command-type analytics events.
type CommandAnalyticsCategory = "search" | "aiprompt" | "other"

function getCommandAnalyticsCategory(
  openMode: OPEN_MODE,
): CommandAnalyticsCategory {
  const type = OPEN_MODE_TYPE_MAP[openMode]
  if (type === COMMAND_TYPE.SEARCH) return "search"
  if (type === COMMAND_TYPE.AI_PROMPT) return "aiprompt"
  return "other"
}

// Per-command-type analytics events, keyed by the coarse category derived
// from getCommandAnalyticsCategory().
const COMMAND_CREATE_EVENTS: Record<
  CommandAnalyticsCategory,
  AnalyticsEventName
> = {
  search: ANALYTICS_EVENTS.COMMAND_CREATE_SEARCH,
  aiprompt: ANALYTICS_EVENTS.COMMAND_CREATE_AIPROMPT,
  other: ANALYTICS_EVENTS.COMMAND_CREATE_OTHER,
}

const HUB_ADD_EVENTS: Record<CommandAnalyticsCategory, AnalyticsEventName> = {
  search: ANALYTICS_EVENTS.HUB_ADD_SEARCH,
  aiprompt: ANALYTICS_EVENTS.HUB_ADD_AIPROMPT,
  other: ANALYTICS_EVENTS.HUB_ADD_OTHER,
}

// Wraps a category->event lookup table into a getter keyed directly by
// OPEN_MODE, so callers don't need to know about CommandAnalyticsCategory.
function createCategoryEventGetter(
  events: Record<CommandAnalyticsCategory, AnalyticsEventName>,
) {
  return (openMode: OPEN_MODE): AnalyticsEventName =>
    events[getCommandAnalyticsCategory(openMode)]
}

export const getCommandCreateEvent = createCategoryEventGetter(
  COMMAND_CREATE_EVENTS,
)

export const getHubAddEvent = createCategoryEventGetter(HUB_ADD_EVENTS)

// https://developer.chrome.com/docs/extensions/how-to/integrate/google-analytics-4

export async function sendEvent(
  name: AnalyticsEventName,
  params: any,
  screen = SCREEN.CONTENT_SCRIPT,
) {
  console.debug(`[analytics] sendEvent: ${name}`, params, screen)

  // Do not send analytics data if running in CI or e2e build.
  if (DISABLE_ANALYTICS || !MEASUREMENT_ID || !API_SECRET) {
    return
  }

  const endpoint = isDebug ? GA_DEBUG_ENDPOINT : GA_ENDPOINT
  try {
    const [{ clientId, userId }, sessionId] = await Promise.all([
      getClientIdAndUserId(),
      getOrCreateSessionId(),
    ])
    const res = await fetch(
      `${endpoint}?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`,
      {
        method: "POST",
        body: JSON.stringify({
          client_id: clientId,
          ...(userId ? { user_id: userId } : {}),
          events: [
            {
              name: name,
              params: {
                page_title: APP_ID,
                app_version: VERSION,
                screen: screen,
                session_id: sessionId,
                engagement_time_msec: DEFAULT_ENGAGEMENT_TIME_IN_MSEC,
                ...params,
              },
            },
          ],
        }),
        keepalive: true,
      },
    )
    if (isDebug) {
      console.log(await res.text())
    }
  } catch (e) {
    console.warn(e)
  }
}

// Sends HUB_LINK_CLICK for the given route. Every route to the Hub lives on
// the options page, so the screen is fixed here.
export function sendHubLinkClick(route: HubLinkRoute) {
  return sendEvent(
    ANALYTICS_EVENTS.HUB_LINK_CLICK,
    { event_label: route },
    SCREEN.OPTION,
  )
}

// Reads CLIENT_ID and HUB_USER in a single chrome.storage.local.get call
// instead of two separate round trips, generating a client_id on first use.
async function getClientIdAndUserId(): Promise<{
  clientId: string
  userId?: string
}> {
  const result = await chrome.storage.local.get([
    LOCAL_STORAGE_KEY.CLIENT_ID,
    LOCAL_STORAGE_KEY.HUB_USER,
  ])
  const clientId =
    (result[LOCAL_STORAGE_KEY.CLIENT_ID] as string | undefined) ||
    (await getOrCreateClientId())
  const hubUser = result[LOCAL_STORAGE_KEY.HUB_USER] as HubUser | null
  return { clientId, userId: hubUser?.id || undefined }
}

// In-flight creation shared by concurrent callers in this context.
let pendingClientId: Promise<string> | null = null

/**
 * Read the client_id, generating and persisting one if none exists yet.
 *
 * The read-then-write is not atomic, so concurrent callers could each
 * generate a different id and split one install into two GA4 clients
 * (#479). Concurrent calls within a context therefore share one in-flight
 * promise, and the service worker settles the id on install before any
 * other context (e.g. the onboarding page) can run.
 */
export function getOrCreateClientId(): Promise<string> {
  if (!pendingClientId) {
    pendingClientId = (async () => {
      let clientId = await Storage.get<string>(LOCAL_STORAGE_KEY.CLIENT_ID)
      if (!clientId) {
        clientId = crypto.randomUUID()
        await Storage.set(LOCAL_STORAGE_KEY.CLIENT_ID, clientId)
      }
      return clientId
    })().finally(() => {
      pendingClientId = null
    })
  }
  return pendingClientId
}

// GA4 caps event parameter values at 100 characters.
const MAX_PARAM_LENGTH = 100

const truncateParam = (value: string): string =>
  value.slice(0, MAX_PARAM_LENGTH)

// Matches URLs of any scheme (https:, chrome-extension:, file:, ...).
const URL_PATTERN = /\b[a-z][a-z0-9+.-]*:\/\/\S+/gi

/**
 * Format a caught error as a GA4 event parameter value. URLs are masked so
 * that page addresses, local file paths and the extension id do not leave
 * the browser.
 */
export const toErrorMessageParam = (error: unknown): string =>
  truncateParam(
    (error instanceof Error ? error.message : String(error)).replace(
      URL_PATTERN,
      "<url>",
    ),
  )

type NavigatorWithUAData = Navigator & {
  userAgentData?: { brands?: { brand: string; version: string }[] }
}

/**
 * Browser details that Measurement Protocol does not collect on its own
 * (device/browser are "(not set)" in GA4), used to tell Chromium-based
 * browsers and automated environments apart. Works in both window and
 * service worker contexts.
 */
export function getBrowserEnvironmentParams(): {
  browser_brands: string
  is_webdriver: string
} {
  const nav = globalThis.navigator as NavigatorWithUAData | undefined
  const brands = (nav?.userAgentData?.brands ?? [])
    // Skip GREASE entries such as "Not A(Brand" or "Not)A;Brand". Their
    // spelling varies by version; a missed one only adds noise to the value.
    .filter(({ brand }) => !/not.a.brand/i.test(brand))
    .map(({ brand, version }) => `${brand}/${version}`)
    .join(",")
  return {
    browser_brands: truncateParam(brands || "unknown"),
    is_webdriver: String(nav?.webdriver ?? "unknown"),
  }
}

async function getOrCreateSessionId() {
  let sessionData = await Storage.get<SessionData | null>(
    SESSION_STORAGE_KEY.SESSION_DATA,
  )
  const currentTimeInMs = Date.now()
  if (sessionData && sessionData.timestamp) {
    const durationInMin = (currentTimeInMs - sessionData.timestamp) / 60000
    if (durationInMin > SESSION_EXPIRATION_IN_MIN) {
      sessionData = null
    } else {
      sessionData.timestamp = currentTimeInMs
      await chrome.storage.session.set({ sessionData })
    }
  }
  if (!sessionData) {
    sessionData = {
      session_id: currentTimeInMs.toString(),
      timestamp: currentTimeInMs,
    }
    await Storage.set(SESSION_STORAGE_KEY.SESSION_DATA, sessionData)
  }
  return sessionData.session_id
}
