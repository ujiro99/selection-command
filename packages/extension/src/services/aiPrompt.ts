import { SelectorType } from "@/const"
import { HUB_URL } from "@/const"
import { Storage, LOCAL_STORAGE_KEY } from "@/services/storage"
import type { Caches } from "@/types"

/**
 * Defines selectors and configuration for a supported AI service.
 */
export type AiService = {
  id: string
  name: string
  url: string
  faviconUrl: string
  inputSelectors: string[]
  submitSelectors: string[]
  selectorType: SelectorType
}

/** External endpoint URL for AI service config data. */
const AI_SERVICES_URL = `${HUB_URL}/data/ai-services.json`

/**
 * List of supported AI services with their DOM selectors.
 * Used as fallback when the external fetch fails and no cache is available.
 * Selector arrays are tried in order, using the first one that matches.
 */
const AI_SERVICES_FALLBACK: AiService[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    url: "https://chatgpt.com",
    faviconUrl: "https://chatgpt.com/favicon.ico",
    inputSelectors: ["#prompt-textarea", "[data-testid='prompt-textarea']"],
    submitSelectors: [
      "form button.composer-submit-button-color",
      "button#composer-submit-button",
      "button[data-testid='composer-speech-button']",
    ],
    selectorType: SelectorType.css,
  },
  {
    id: "gemini",
    name: "Gemini",
    url: "https://gemini.google.com/app",
    faviconUrl:
      "https://www.gstatic.com/lamda/images/gemini_sparkle_aurora_33f86dc0c0257da337c63.svg",
    inputSelectors: [".ql-editor[contenteditable='true']"],
    submitSelectors: ["button.send-button", "button mat-icon[fonticon='send']"],
    selectorType: SelectorType.css,
  },
  {
    id: "claude",
    name: "Claude",
    url: "https://claude.ai/new",
    faviconUrl: "https://claude.ai/favicon.ico",
    inputSelectors: [
      "div[contenteditable='true'][aria-label]",
      "div[contenteditable='true'].ProseMirror",
    ],
    submitSelectors: [
      "#main-content button.Button_claude__c_hZy",
      "#main-content button[data-state='closed']",
    ],
    selectorType: SelectorType.css,
  },
  {
    id: "perplexity",
    name: "Perplexity",
    url: "https://www.perplexity.ai",
    faviconUrl: "https://favicon.im/perplexity.ai",
    inputSelectors: [
      "div#ask-input",
      "div[contenteditable='true'][role='textbox']",
    ],
    submitSelectors: [
      "button[type='button']:has(use[*|href='#pplx-icon-custom-perplexity-v2v'])",
      "button[type='button']:has(use[*|href='#pplx-icon-arrow-up'])",
      "button[type='button']:has(use[*|href^='#pplx-icon-arrow-right'])",
      "button[aria-label='Submit']",
    ],
    selectorType: SelectorType.css,
  },
]

/** Today's date string "YYYY-MM-DD" used as cache TTL key. */
const todayStr = (): string => new Date().toISOString().slice(0, 10)

/**
 * Normalize raw JSON data fetched from the external endpoint into AiService[].
 * Items that are missing required fields (id, url, inputSelectors, submitSelectors)
 * are silently skipped.  The external JSON may omit `selectorType`, defaulting to CSS.
 */
const normalizeServices = (raw: unknown[]): AiService[] => {
  const results: AiService[] = []
  for (const item of raw) {
    const s = item as Partial<AiService>
    if (
      !s.id ||
      !s.url ||
      !Array.isArray(s.inputSelectors) ||
      !Array.isArray(s.submitSelectors) ||
      s.inputSelectors.length === 0 ||
      s.submitSelectors.length === 0
    ) {
      console.warn("Skipping invalid AI service entry:", s)
      continue
    }
    results.push({
      id: s.id,
      name: s.name ?? s.id,
      url: s.url,
      faviconUrl: s.faviconUrl ?? "",
      inputSelectors: s.inputSelectors,
      submitSelectors: s.submitSelectors,
      selectorType: s.selectorType ?? SelectorType.css,
    })
  }
  return results
}

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

/**
 * Return the list of AI services synchronously using only the hardcoded fallback.
 * Used in UI contexts where async is not available (e.g. option section rendering).
 */
export const getAiServicesFallback = (): AiService[] => AI_SERVICES_FALLBACK
