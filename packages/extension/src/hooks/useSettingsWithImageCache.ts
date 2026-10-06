import { useEffect, useMemo, useState } from "react"
import { CACHE_SECTIONS } from "@/services/settings/settingsCache"
import { getAiServicesFallback } from "@/services/aiPromptFallback"
import { useSection, useUserSettings } from "./useSettings"
import { Ipc, IpcTimeoutError, ServiceWorkerCommand } from "@/services/ipc"
import type { IconColorQuery } from "@/services/ipc"
import { sendEvent, ANALYTICS_EVENTS } from "@/services/analytics"
import { getCommandTargetUrl, isAiPromptCommand, isEmpty } from "@/lib/utils"
import type { Command, CommandFolder } from "@/types"

/**
 * A menu entry whose icon has been resolved against the image cache.
 *
 * `iconUrl` becomes the cached data URL whenever the cache holds one, and a data
 * URL carries no hint about where the icon came from. Anything that depends on
 * the icon's origin is therefore decided here, while the user-configured URL is
 * still at hand, and handed to the menu as `preserveOriginalColor`.
 */
type ResolvedIcon = {
  /** Whether the icon must keep its own colors instead of being recolored. */
  preserveOriginalColor: boolean
}

export type ResolvedCommand = Command & ResolvedIcon
export type ResolvedFolder = CommandFolder & ResolvedIcon

type HasIconUrl = { id: string; iconUrl?: string }

/** Replaces the icon URL with its cached data URL when one is available. */
function applyImageCache<T extends HasIconUrl>(
  item: T,
  images: Record<string, string> | undefined,
): T {
  if (!item.iconUrl || !images) return item
  const cache = images[item.iconUrl]
  return isEmpty(cache) ? item : { ...item, iconUrl: cache }
}

/**
 * Decisions the service worker has already answered, keyed by their query.
 *
 * Whether an icon belongs to the site a command targets is decided against the
 * Public Suffix List, which is far too large to ship into every page, so the
 * service worker answers it instead. The answers are kept here so a menu that
 * reopens - or a command whose icon has not changed - needs no further round
 * trip.
 */
const answerCache = new Map<string, boolean>()

/** Upper bound of `answerCache`, so a long-lived page cannot grow it forever. */
const ANSWER_CACHE_LIMIT = 1000

/** Stores an answer, evicting the oldest one (insertion order) when full. */
const rememberAnswer = (key: string, value: boolean) => {
  answerCache.delete(key)
  if (answerCache.size >= ANSWER_CACHE_LIMIT) {
    const oldest = answerCache.keys().next().value
    if (oldest !== undefined) answerCache.delete(oldest)
  }
  answerCache.set(key, value)
}

/**
 * How long the menu waits for the service worker before it falls back to the
 * default colors. The menu does not render until the answer is in, so this
 * bounds the delay when the worker is slow to wake up or never answers.
 */
export const ICON_COLOR_TIMEOUT_MS = 500

/** Answers slower than this are reported, to see how long the menu waits. */
export const ICON_COLOR_SLOW_THRESHOLD_MS = 250

/** Events already reported from this page; each is sent at most once. */
const reportedEvents = new Set<string>()

const reportOnce = (
  event:
    | typeof ANALYTICS_EVENTS.ICON_COLOR_RESOLVE_FAILED
    | typeof ANALYTICS_EVENTS.ICON_COLOR_RESOLVE_SLOW,
  params: Record<string, unknown>,
) => {
  if (reportedEvents.has(event)) return
  reportedEvents.add(event)
  sendEvent(event, params)
}

/** Thrown when the service worker answers with something unusable. */
class InvalidIconColorResponseError extends Error {}

const failureReason = (e: unknown) => {
  if (e instanceof IpcTimeoutError) return "timeout"
  if (e instanceof InvalidIconColorResponseError) return "invalid_response"
  return "error"
}

const queryKey = (query: IconColorQuery) =>
  `${query.url ?? ""}\n${query.targetUrl ?? ""}`

const aiServiceUrlById = new Map(
  getAiServicesFallback().map((service) => [service.id, service.url]),
)

const getIconTargetUrl = (command: Command) =>
  isAiPromptCommand(command)
    ? aiServiceUrlById.get(command.aiPromptOption.serviceId)
    : getCommandTargetUrl(command)

/**
 * Resolves every query, asking the service worker only about the ones it has
 * not answered yet. Returns null until the answers for `queries` are in.
 *
 * When the service worker fails to answer (e.g. an outdated worker that does
 * not know the command), the unanswered queries fall back to `false` so the
 * menu still renders with the default (recolored) icons.
 */
function usePreservedIconColors(queries: IconColorQuery[]): boolean[] | null {
  const [, setResolvedVersion] = useState(0)
  const [failedQueries, setFailedQueries] = useState<IconColorQuery[] | null>(
    null,
  )

  useEffect(() => {
    let active = true

    const resolve = async () => {
      const unknown = queries.filter((q) => !answerCache.has(queryKey(q)))
      if (unknown.length > 0) {
        const startedAt = performance.now()
        try {
          const results = await Ipc.send<IconColorQuery[], boolean[]>(
            ServiceWorkerCommand.resolveIconColors,
            unknown,
            { timeoutMs: ICON_COLOR_TIMEOUT_MS },
          )
          if (!Array.isArray(results)) {
            // Keep values out of the message: it is sent to analytics.
            throw new InvalidIconColorResponseError(
              "Unexpected icon color response",
            )
          }
          if (results.length !== unknown.length) {
            throw new InvalidIconColorResponseError(
              "Unexpected icon color response length",
            )
          }
          unknown.forEach((q, i) => rememberAnswer(queryKey(q), results[i]))
          const elapsed = performance.now() - startedAt
          if (elapsed >= ICON_COLOR_SLOW_THRESHOLD_MS) {
            reportOnce(ANALYTICS_EVENTS.ICON_COLOR_RESOLVE_SLOW, {
              elapsed_ms: Math.round(elapsed),
              query_count: unknown.length,
            })
          }
        } catch (e) {
          // Leave them uncached so the next menu retries instead of sticking
          // with a decision that failed to arrive.
          console.warn("Failed to resolve icon colors", e)
          reportOnce(ANALYTICS_EVENTS.ICON_COLOR_RESOLVE_FAILED, {
            reason: failureReason(e),
            // GA4 truncates parameter values at 100 characters.
            error: String(e instanceof Error ? e.message : e).slice(0, 100),
            elapsed_ms: Math.round(performance.now() - startedAt),
            query_count: unknown.length,
          })
        }
      }
      if (!active) return
      if (queries.some((q) => !answerCache.has(queryKey(q)))) {
        // Render with the default colors rather than blocking the menu.
        setFailedQueries(queries)
        return
      }
      setResolvedVersion((version) => version + 1)
    }
    resolve()

    return () => {
      active = false
    }
  }, [queries])

  if (queries.some((q) => !answerCache.has(queryKey(q)))) {
    if (failedQueries !== queries) return null
  }

  return queries.map((q) => answerCache.get(queryKey(q)) ?? false)
}

/**
 * User settings whose commands and folders are ready to render: icons come from
 * the image cache and their recoloring decision is already resolved.
 */
export function useSettingsWithImageCache() {
  const { userSettings, loading: loadingSettings } = useUserSettings()
  const { data: commands, loading: loadingCommands } = useSection(
    CACHE_SECTIONS.COMMANDS,
  )
  const { data: caches, loading: loadingCaches } = useSection(
    CACHE_SECTIONS.CACHES,
  )
  const loadingData = loadingSettings || loadingCommands || loadingCaches
  const folders = useMemo(
    () => userSettings.folders ?? [],
    [userSettings.folders],
  )

  // Commands first, then folders: the answers come back in the same order.
  const queries = useMemo<IconColorQuery[]>(() => {
    if (loadingData || !commands) return []
    return [
      ...commands.map((c) => ({
        url: c.iconUrl,
        targetUrl: getIconTargetUrl(c),
      })),
      ...folders.map((f) => ({ url: f.iconUrl })),
    ]
  }, [loadingData, commands, folders])

  const preserved = usePreservedIconColors(queries)
  const loading = loadingData || preserved == null

  const resolved = useMemo<{
    commands: ResolvedCommand[]
    folders: ResolvedFolder[]
  }>(() => {
    if (loading || !commands || !preserved) {
      return { commands: [], folders: [] }
    }

    const images = caches?.images
    return {
      commands: commands.map((c, i) => ({
        ...applyImageCache(c, images),
        preserveOriginalColor: preserved[i] ?? false,
      })),
      folders: folders.map((f, i) => ({
        ...applyImageCache(f, images),
        preserveOriginalColor: preserved[commands.length + i] ?? false,
      })),
    }
  }, [loading, commands, folders, caches, preserved])

  return {
    userSettings,
    commands: resolved.commands,
    folders: resolved.folders,
    loading,
  }
}
