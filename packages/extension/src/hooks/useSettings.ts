import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { enhancedSettings } from "../services/settings/enhancedSettings"
import {
  settingsCache,
  CacheSection,
  CACHE_SECTIONS,
} from "../services/settings/settingsCache"

import type {
  SettingsType,
  Command,
  Star,
  UserStats,
  ShortcutSettings,
  UserSettings,
  PageRule,
} from "@/types"
import { isEmpty, findMatchingPageRule } from "@/lib/utils"
import { INHERIT } from "@/const"

// Apply page rule to settings, modifying popupPlacement if needed
function applyPageRuleToSettings(
  settings: Partial<SettingsType>,
  pageRule: PageRule | undefined,
): void {
  if (
    pageRule != null &&
    pageRule.popupPlacement !== INHERIT &&
    settings.popupPlacement
  ) {
    settings.popupPlacement = pageRule.popupPlacement
  }
}

// Type definitions for section-specific hook return values
type SectionData<T extends CacheSection> =
  T extends typeof CACHE_SECTIONS.COMMANDS
    ? Command[]
    : T extends typeof CACHE_SECTIONS.USER_SETTINGS
      ? UserSettings
      : T extends typeof CACHE_SECTIONS.STARS
        ? Star[]
        : T extends typeof CACHE_SECTIONS.SHORTCUTS
          ? ShortcutSettings
          : T extends typeof CACHE_SECTIONS.USER_STATS
            ? UserStats
            : any

// Common async data fetching hook
function useAsyncData<T>(
  loader: () => Promise<T>,
  deps: React.DependencyList,
  subscriptions?: {
    subscribe: (callback: () => void) => void
    unsubscribe: (callback: () => void) => void
  }[],
): {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
} {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const mountedRef = useRef(true)

  const loadData = useCallback(async () => {
    if (!mountedRef.current) return

    try {
      setLoading(true)
      setError(null)
      const result = await loader()

      if (mountedRef.current) {
        setData(result)
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error("Unknown error"))
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, deps)

  const refetch = useCallback(async () => {
    await loadData()
  }, [loadData])

  // Initial load and cleanup
  useEffect(() => {
    mountedRef.current = true
    loadData()

    return () => {
      mountedRef.current = false
    }
  }, deps)

  // Setup change monitoring
  useEffect(() => {
    if (!subscriptions) return

    const handleChange = () => {
      if (mountedRef.current) {
        loadData()
      }
    }

    subscriptions.forEach((subscription) => {
      subscription.subscribe(handleChange)
    })

    return () => {
      subscriptions.forEach((subscription) => {
        subscription.unsubscribe(handleChange)
      })
    }
  }, [...deps, loadData])

  return { data, loading, error, refetch }
}

// Section-specific hook
export function useSection<T extends CacheSection>(
  section: T,
  forceFresh = false,
): {
  data: SectionData<T> | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
} {
  return useAsyncData<SectionData<T>>(
    () => enhancedSettings.getSection(section, forceFresh),
    [section, forceFresh],
    [
      {
        subscribe: (callback) => settingsCache.subscribe(section, callback),
        unsubscribe: (callback) => settingsCache.unsubscribe(section, callback),
      },
    ],
  )
}

// User settings-specific hook
export function useUserSettings() {
  const { data, loading, error, refetch } = useSection(
    CACHE_SECTIONS.USER_SETTINGS,
  )
  // Find matching page rule and apply to settings
  const pageRule = useMemo(() => {
    if (!data) return undefined
    if (typeof window === "undefined") return undefined
    return findMatchingPageRule(data.pageRules ?? [], window.location.href)
  }, [data])

  const userSettings = useMemo(() => {
    if (!data) return {} as UserSettings
    const settings: UserSettings = { ...data }
    applyPageRuleToSettings(settings, pageRule)
    return settings
  }, [data, pageRule])

  return {
    userSettings,
    pageRule,
    loading,
    error,
    refetch,
  }
}

type HasIconUrl = { id: string; iconUrl?: string }

/** Maps ids to their configured icon URL, before image caching is applied. */
function toIconUrlMap(items: HasIconUrl[]): Record<string, string> {
  return items.reduce(
    (acc, cur) => (cur.iconUrl ? { ...acc, [cur.id]: cur.iconUrl } : acc),
    {} as Record<string, string>,
  )
}

/** Replaces the icon URL with its cached data URL when one is available. */
function applyImageCache<T extends HasIconUrl>(
  item: T,
  images: Record<string, string> | undefined,
): T {
  if (!item.iconUrl || !images) return item
  const cache = images[item.iconUrl]
  return isEmpty(cache) ? item : { ...item, iconUrl: cache }
}

// Settings hook with image cache applied
export function useSettingsWithImageCache() {
  const { userSettings: settings, loading: loading1 } = useUserSettings()
  const { data: commands, loading: loading2 } = useSection(
    CACHE_SECTIONS.COMMANDS,
  )
  const { data: caches, loading: loading3 } = useSection(CACHE_SECTIONS.CACHES)
  const loading = loading1 || loading2 || loading3

  const { commandsWithCache, foldersWithCache, iconUrls, folderIconUrls } =
    useMemo(() => {
      if (loading || !commands) {
        return {
          commandsWithCache: [],
          foldersWithCache: [],
          iconUrls: {},
          folderIconUrls: {},
        }
      }

      const folders = settings.folders || []
      const commandsWithCache = commands.map((c) =>
        applyImageCache(c, caches?.images),
      )
      const foldersWithCache = folders.map((f) =>
        applyImageCache(f, caches?.images),
      )

      // IconUrls maps - contain original URLs before cache application
      return {
        commandsWithCache,
        foldersWithCache,
        iconUrls: toIconUrlMap(commands),
        folderIconUrls: toIconUrlMap(folders),
      }
    }, [settings, loading, caches, commands])

  return {
    userSettings: settings,
    commands: commandsWithCache,
    folders: foldersWithCache,
    iconUrls,
    folderIconUrls,
    loading,
  }
}
