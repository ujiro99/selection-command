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
  ONBOARDING_START: "onboarding_start",
  ONBOARDING_SKIP: "onboarding_skip",
  ONBOARDING_FIRST_SELECTION: "onboarding_first_selection",
  ONBOARDING_COMMAND_EXECUTE: "onboarding_command_execute",
  ONBOARDING_FIRST_VALUE: "onboarding_first_value",
  ONBOARDING_COMPLETE: "onboarding_complete",
} as const

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
  let clientId = result[LOCAL_STORAGE_KEY.CLIENT_ID] as string | undefined
  if (!clientId) {
    clientId = crypto.randomUUID()
    await Storage.set(LOCAL_STORAGE_KEY.CLIENT_ID, clientId)
  }
  const hubUser = result[LOCAL_STORAGE_KEY.HUB_USER] as HubUser | null
  return { clientId, userId: hubUser?.id || undefined }
}

export async function getOrCreateClientId() {
  let clientId = await Storage.get(LOCAL_STORAGE_KEY.CLIENT_ID)
  if (!clientId) {
    clientId = crypto.randomUUID()
    await Storage.set(LOCAL_STORAGE_KEY.CLIENT_ID, clientId)
  }
  return clientId
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
