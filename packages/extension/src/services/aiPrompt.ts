import { HUB_URL } from "@/const"
import { Storage, LOCAL_STORAGE_KEY } from "@/services/storage"
import type { Caches, AiService } from "@/types"
import {
  normalizeServices,
  AI_SERVICES_FALLBACK,
  getAiServicesFallback,
} from "@/services/aiPromptFallback"

export { getAiServicesFallback }

/** External endpoint URL for AI service config data. */
const AI_SERVICES_URL = `${HUB_URL}/data/ai-services.json`

/** Today's date string "YYYY-MM-DD" used as cache TTL key. */
const todayStr = (): string => new Date().toISOString().slice(0, 10)

/**
 * Retrieve AI service definitions.
 * Strategy:
 *  1. Return today's cached data from chrome.storage.local if available.
 *  2. Fetch from the external endpoint and cache for the day.
 *  3. On fetch failure, return the latest cached data (any date).
 *  4. If no cache at all, return the hardcoded fallback list.
 */
export const getAiServices = async (): Promise<AiService[]> => {
  const today = todayStr()

  // 1. Check today's cache
  const caches = await Storage.get<Caches>(LOCAL_STORAGE_KEY.CACHES)
  if (caches.aiServices?.date === today) {
    return caches.aiServices.services
  }

  // 2. Fetch from external endpoint
  try {
    const raw = await fetch(AI_SERVICES_URL).then((res) => {
      if (!res.ok)
        throw new Error(
          `Failed to fetch AI services from ${AI_SERVICES_URL}: HTTP ${res.status}`,
        )
      return res.json()
    })
    if (!Array.isArray(raw)) {
      throw new Error(
        `Unexpected AI services response format from ${AI_SERVICES_URL}`,
      )
    }
    const services = normalizeServices(raw)

    // 3. Save to cache
    await Storage.set<Caches>(LOCAL_STORAGE_KEY.CACHES, {
      ...caches,
      aiServices: { date: today, services },
    })

    return services
  } catch (error) {
    console.warn("Failed to fetch AI service configs:", error)

    // 4. Use stale cache if available
    if (caches.aiServices?.services?.length) {
      return caches.aiServices.services
    }

    // 5. Final fallback: hardcoded defaults
    return AI_SERVICES_FALLBACK
  }
}

/**
 * Find an AI service by its ID (async, uses getAiServices with caching).
 */
export const findAiService = async (
  id: string,
): Promise<AiService | undefined> => {
  const services = await getAiServices()
  return services.find((s) => s.id === id)
}
