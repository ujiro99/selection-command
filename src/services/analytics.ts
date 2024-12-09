import {
  Storage,
  LOCAL_STORAGE_KEY,
  SESSION_STORAGE_KEY,
  STORAGE_AREA as AREA,
} from './storage'
import { SessionData } from '@/types'

const GA_ENDPOINT = 'https://www.google-analytics.com/mp/collect'
const MEASUREMENT_ID = process.env.MEASUREMENT_ID
const API_SECRET = process.env.API_SECRET
const DEFAULT_ENGAGEMENT_TIME_IN_MSEC = 100
const SESSION_EXPIRATION_IN_MIN = 30

// https://developer.chrome.com/docs/extensions/how-to/integrate/google-analytics-4?t

export async function sendEvent(name: string, id: string) {
  try {
    fetch(
      `${GA_ENDPOINT}?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`,
      {
        method: 'POST',
        body: JSON.stringify({
          client_id: await getOrCreateClientId(),
          events: [
            {
              name: name,
              params: {
                id: id,
                session_id: await getOrCreateSessionId(),
                engagement_time_msec: DEFAULT_ENGAGEMENT_TIME_IN_MSEC,
              },
            },
          ],
        }),
      },
    )
  } catch (e) {
    console.warn(e)
  }
}

async function getOrCreateClientId() {
  let clientId = await Storage.get(LOCAL_STORAGE_KEY.CLIENT_ID, AREA.LOCAL)
  if (!clientId) {
    clientId = crypto.randomUUID()
    await Storage.set(LOCAL_STORAGE_KEY.CLIENT_ID, clientId, AREA.LOCAL)
  }
  return clientId
}

async function getOrCreateSessionId() {
  let sessionData = await Storage.get<SessionData | null>(
    SESSION_STORAGE_KEY.SESSION_DATA,
    AREA.SESSION,
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
    await Storage.set(
      SESSION_STORAGE_KEY.SESSION_DATA,
      sessionData,
      AREA.SESSION,
    )
  }
  return sessionData.session_id
}
