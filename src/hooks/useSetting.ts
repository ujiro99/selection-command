import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { enhancedSettings } from "../services/enhancedSettings"
import {
  settingsCache,
  CacheSection,
  CACHE_SECTIONS,
} from "../services/settingsCache"

import type {
  SettingsType,
  Command,
  Star,
  UserStats,
  ShortcutSettings,
  UserSettings,
  PageRule,
} from "@/types"
import { isEmpty } from "@/lib/utils"
import { INHERIT } from "@/const"

// Find page rule that matches current URL
function findMatchingPageRule(
  settings: Partial<SettingsType>,
): PageRule | undefined {
  if (!settings || typeof window === "undefined") return undefined

  const rule = (settings.pageRules || [])
    .filter((r) => !isEmpty(r.urlPattern))
    .find((rule) => {
      try {
        const re = new RegExp(rule.urlPattern)
        return window.location.href.match(re) != null
      } catch {
        return false
      }
    })

  return rule
}

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
export function useUserSettings(forceFresh = false) {
  const { data, loading, error, refetch } = useSection(
    CACHE_SECTIONS.USER_SETTINGS,
    forceFresh,
  )

  // Find matching page rule and apply to settings
  const pageRule = useMemo(() => {
    if (!data) return undefined
    return findMatchingPageRule(data)
  }, [data])

  const userSettings = useMemo(() => {
    if (!data) return {} as UserSettings

    const settings = { ...data } as UserSettings
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

// Integrated settings hook (specify only required sections)
export function useSetting(
  sections: CacheSection[] = [
    CACHE_SECTIONS.COMMANDS,
    CACHE_SECTIONS.USER_SETTINGS,
  ],
  forceFresh = false,
): {
  settings: Partial<SettingsType>
  pageRule: PageRule | undefined
  loading: boolean
} {
  const sectionsRef = useRef(sections)
  const sectionsKey = useMemo(() => sections.join(","), [sections])

  // Update when sections change
  useEffect(() => {
    sectionsRef.current = sections
  }, [sections])

  const { data: settings, loading } = useAsyncData<Partial<SettingsType>>(
    () =>
      enhancedSettings.get({
        sections: sectionsRef.current,
        forceFresh,
      }),
    [sectionsKey, forceFresh],
    sections.map((section) => ({
      subscribe: (callback) => settingsCache.subscribe(section, callback),
      unsubscribe: (callback) => settingsCache.unsubscribe(section, callback),
    })),
  )

  // Find matching page rule using centralized logic
  const pageRule = useMemo(() => {
    if (!settings) return undefined
    const rule = findMatchingPageRule(settings)
    if (rule) {
      applyPageRuleToSettings(settings, rule)
    }
    return rule
  }, [settings])

  return {
    settings: settings || {},
    pageRule,
    loading,
  }
}

// Settings hook with image cache applied
export function useSettingsWithImageCache() {
  const { settings, loading } = useSetting([
    CACHE_SECTIONS.COMMANDS,
    CACHE_SECTIONS.USER_SETTINGS,
    CACHE_SECTIONS.CACHES,
  ])

  const { commandsWithCache, foldersWithCache, iconUrls } = useMemo(() => {
    if (loading || !settings.commands) {
      return { commandsWithCache: [], foldersWithCache: [], iconUrls: {} }
    }

    const caches = (settings as any).caches || { images: {} }

    // Commands with cache
    const commandsWithCache = settings.commands.map((c) => {
      const cache = caches.images[c.iconUrl]
      const iconUrl = !isEmpty(cache) ? cache : c.iconUrl
      return { ...c, iconUrl }
    })

    // Folders with cache
    const foldersWithCache = (settings.folders || []).map((f) => {
      if (!f.iconUrl) return f
      const cache = caches.images[f.iconUrl]
      const iconUrl = !isEmpty(cache) ? cache : f.iconUrl
      return { ...f, iconUrl }
    })

    // IconUrls map
    const iconUrls = commandsWithCache.reduce(
      (acc, cur) => ({ ...acc, [cur.id]: cur.iconUrl }),
      {} as Record<string, string>,
    )

    return { commandsWithCache, foldersWithCache, iconUrls }
  }, [settings, loading])

  return {
    commands: commandsWithCache,
    folders: foldersWithCache,
    iconUrls,
  }
}
