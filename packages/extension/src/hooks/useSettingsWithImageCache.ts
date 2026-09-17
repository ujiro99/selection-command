import { useEffect, useMemo, useState } from "react"
import { CACHE_SECTIONS } from "@/services/settings/settingsCache"
import { useSection, useUserSettings } from "./useSettings"
import { Ipc, BgCommand } from "@/services/ipc"
import type { IconColorQuery } from "@/services/ipc"
import { getCommandTargetUrl, isEmpty } from "@/lib/utils"
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

const queryKey = (query: IconColorQuery) =>
  `${query.url ?? ""}\n${query.targetUrl ?? ""}`

/**
 * Resolves every query, asking the service worker only about the ones it has
 * not answered yet. Returns null until the answers for `queries` are in.
 */
function usePreservedIconColors(queries: IconColorQuery[]): boolean[] | null {
  const [answers, setAnswers] = useState<{
    queries: IconColorQuery[]
    values: boolean[]
  } | null>(null)

  useEffect(() => {
    let active = true

    const resolve = async () => {
      const unknown = queries.filter((q) => !answerCache.has(queryKey(q)))
      if (unknown.length > 0) {
        try {
          const results = await Ipc.send<IconColorQuery[], boolean[]>(
            BgCommand.resolveIconColors,
            unknown,
          )
          if (results.length !== unknown.length) {
            throw new Error(
              `Unexpected icon color response length: expected ${unknown.length}, got ${results.length}`,
            )
          }
          unknown.forEach((q, i) => answerCache.set(queryKey(q), results[i]))
        } catch (e) {
          // Leave them uncached so the next menu retries instead of sticking
          // with a decision that failed to arrive.
          console.warn("Failed to resolve icon colors", e)
        }
      }
      if (!active) return
      if (queries.some((q) => !answerCache.has(queryKey(q)))) {
        return
      }
      setAnswers({
        queries,
        values: queries.map((q) => answerCache.get(queryKey(q)) as boolean),
      })
    }
    resolve()

    return () => {
      active = false
    }
  }, [queries])

  return answers?.queries === queries ? answers.values : null
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
        targetUrl: getCommandTargetUrl(c),
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
