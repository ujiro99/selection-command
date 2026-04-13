import { SelectorType } from "@/const"
import type { AiService } from "@/types"

/**
 * Normalize raw JSON data fetched from the external endpoint into AiService[].
 * Items missing required fields are silently skipped.
 * Services with a queryUrl may omit inputSelectors/submitSelectors.
 */
export const normalizeServices = (raw: unknown[]): AiService[] => {
  const results: AiService[] = []
  for (const item of raw) {
    const s = item as Partial<AiService>
    if (!s.id || !s.url) {
      console.warn("Skipping invalid AI service entry:", s)
      continue
    }
    const hasQueryUrl = typeof s.queryUrl === "string" && s.queryUrl.length > 0
    const hasSelectors =
      Array.isArray(s.inputSelectors) &&
      Array.isArray(s.submitSelectors) &&
      s.inputSelectors.length > 0 &&
      s.submitSelectors.length > 0
    if (!hasQueryUrl && !hasSelectors) {
      console.warn("Skipping invalid AI service entry:", s)
      continue
    }
    results.push({
      id: s.id,
      name: s.name ?? s.id,
      url: s.url,
      faviconUrl: s.faviconUrl ?? "",
      inputSelectors: s.inputSelectors ?? [],
      submitSelectors: s.submitSelectors ?? [],
      selectorType: s.selectorType ?? SelectorType.css,
      queryUrl: s.queryUrl,
      autoSubmit: s.autoSubmit,
    })
  }
  return results
}

/**
 * List of supported AI services built from the hub's ai-services.json at compile time.
 * Used as fallback when the external fetch fails and no cache is available.
 */
export const AI_SERVICES_FALLBACK: AiService[] =
  normalizeServices(__AI_SERVICES_JSON__)

/**
 * Return the list of AI services synchronously using only the hardcoded fallback.
 * Safe to use in Node.js / non-browser contexts (no chrome dependency).
 */
export const getAiServicesFallback = (): AiService[] => AI_SERVICES_FALLBACK
