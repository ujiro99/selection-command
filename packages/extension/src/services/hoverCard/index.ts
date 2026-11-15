import { translateProvider } from "./providers/translate"
import { runWithFallback } from "./runWithFallback"
import { logHoverCard } from "./log"
import type { HoverCardProviderId } from "@/types"
import type { HoverCardContext, HoverCardProvider } from "./types"

export { HoverCardError } from "./types"
export type { HoverCardContext, HoverCardErrorKind } from "./types"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const providers: Record<HoverCardProviderId, HoverCardProvider<any, any>> = {
  translate: translateProvider,
}

export function getHoverCardProvider(id: HoverCardProviderId) {
  return providers[id]
}

// Results are cached for the page lifetime so that re-hovering is instant.
const MAX_CACHE_ENTRIES = 50
const cache = new Map<string, React.ReactNode>()

function remember(key: string, node: React.ReactNode) {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  cache.set(key, node)
}

/**
 * Produce the hover card content for the selection.
 * Returns null when the provider does not apply to the selection.
 * Throws HoverCardError when no backend could produce a result.
 */
export async function loadHoverCard(
  providerId: HoverCardProviderId,
  selectionText: string,
  opts: { signal: AbortSignal; ctx: HoverCardContext },
): Promise<React.ReactNode | null> {
  const provider = getHoverCardProvider(providerId)
  const input = provider.match(selectionText, opts.ctx)
  if (input == null) return null

  const key = `${provider.id}:${provider.cacheKey(input, opts.ctx)}`
  const cached = cache.get(key)
  if (cached !== undefined) return cached

  try {
    const { output, backendId, attempts } = await runWithFallback(
      provider.backends,
      input,
      opts,
    )
    logHoverCard("attempts:", attempts)
    const node = provider.render(output, { backendId })
    remember(key, node)
    return node
  } catch (e) {
    logHoverCard("failed:", e, (e as { attempts?: unknown }).attempts)
    throw e
  }
}
