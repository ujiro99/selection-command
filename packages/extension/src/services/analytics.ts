import { Storage, LOCAL_STORAGE_KEY, SESSION_STORAGE_KEY } from "./storage"
import { isDebug, APP_ID, VERSION, SCREEN } from "@/const"
import { SessionData } from "@/types"

const GA_ENDPOINT = "https://www.google-analytics.com/mp/collect"
const GA_DEBUG_ENDPOINT = "https://www.google-analytics.com/debug/mp/collect"
const MEASUREMENT_ID = import.meta.env.VITE_MEASUREMENT_ID
const API_SECRET = import.meta.env.VITE_API_SECRET
const DEFAULT_ENGAGEMENT_TIME_IN_MSEC = 100
const SESSION_EXPIRATION_IN_MIN = 30

export const ANALYTICS_EVENTS = {
  SELECTION_COMMAND: "selection_command",
  LINK_COMMAND: "link_command",
  SHORTCUT: "shortcut",
  SHOW_HELP: "show_help",
  SHOW_REVIEW_URL: "show_review_url",
  OPEN_DIALOG: "open_dialog",
  COMMAND_ADD: "command_add",
  COMMAND_EDIT: "command_edit",
  COMMAND_REMOVE: "command_remove",
  COMMAND_SHARE_FORM: "command_share_form",
  COMMAND_HUB_ADD: "command_hub_add",
  COMMAND_HUB_STAR_ADD: "command_hub_star_add",
  COMMAND_HUB_STAR_REMOVE: "command_hub_star_remove",
} as const

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS]

// https://developer.chrome.com/docs/extensions/how-to/integrate/google-analytics-4?t

export async function sendEvent(
  name: AnalyticsEventName,
  params: any,
  screen = SCREEN.CONTENT_SCRIPT,
) {
  const endpoint = isDebug ? GA_DEBUG_ENDPOINT : GA_ENDPOINT
  try {
    const res = await fetch(
      `${endpoint}?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`,
      {
        method: "POST",
        body: JSON.stringify({
          client_id: await getOrCreateClientId(),
          events: [
            {
              name: name,
              params: {
                page_title: APP_ID,
                app_version: VERSION,
                screen: screen,
                session_id: await getOrCreateSessionId(),
                engagement_time_msec: DEFAULT_ENGAGEMENT_TIME_IN_MSEC,
                ...params,
              },
            },
          ],
        }),
      },
    )
    if (isDebug) {
      console.log(await res.text())
    }
  } catch (e) {
    console.warn(e)
  }
}

async function getOrCreateClientId() {
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
