import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { enhancedSettings } from '../services/enhancedSettings'
import {
  settingsCache,
  CacheSection,
  CACHE_SECTIONS,
} from '../services/settingsCache'

// Export CACHE_SECTIONS for external use
export { CACHE_SECTIONS } from '../services/settingsCache'
import type {
  SettingsType,
  Command,
  Star,
  UserStats,
  ShortcutSettings,
  UserSettings,
  PageRule,
} from '@/types'
import { isEmpty } from '@/lib/utils'
import { INHERIT } from '@/const'
import { emptySettings } from './useSetting'

// セクション別Hook戻り値の型定義
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

// セクション別使用Hook
export function useSection<T extends CacheSection>(
  section: T,
  forceFresh = false,
): {
  data: SectionData<T> | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
} {
  const [data, setData] = useState<SectionData<T> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const mountedRef = useRef(true)

  const loadData = useCallback(async () => {
    if (!mountedRef.current) return

    try {
      setLoading(true)
      setError(null)
      const result = await enhancedSettings.getSection(section, forceFresh)

      if (mountedRef.current) {
        setData(result)
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [section, forceFresh])

  const refetch = useCallback(async () => {
    await loadData()
  }, [loadData])

  // 初回ロード
  useEffect(() => {
    mountedRef.current = true
    loadData()
  }, [section, forceFresh])

  // 変更監視の設定
  useEffect(() => {
    const handleChange = () => {
      if (mountedRef.current) {
        loadData()
      }
    }

    settingsCache.subscribe(section, handleChange)

    return () => {
      settingsCache.unsubscribe(section, handleChange)
    }
  }, [section, loadData])

  // クリーンアップ
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  return { data, loading, error, refetch }
}

// コマンド専用Hook
export function useCommands(forceFresh = false) {
  const { data, loading, error, refetch } = useSection(
    CACHE_SECTIONS.COMMANDS,
    forceFresh,
  )

  const updateCommand = useCallback(async (updatedCommand: Command) => {
    await enhancedSettings.updateSection<Command[]>(
      CACHE_SECTIONS.COMMANDS,
      (commands) =>
        commands.map((cmd) =>
          cmd.id === updatedCommand.id ? updatedCommand : cmd,
        ),
    )
  }, [])

  const addCommand = useCallback(async (newCommand: Command) => {
    await enhancedSettings.updateSection<Command[]>(
      CACHE_SECTIONS.COMMANDS,
      (commands) => [...commands, newCommand],
    )
  }, [])

  const removeCommand = useCallback(async (commandId: string) => {
    await enhancedSettings.updateSection<Command[]>(
      CACHE_SECTIONS.COMMANDS,
      (commands) => commands.filter((cmd) => cmd.id !== commandId),
    )
  }, [])

  return {
    commands: data || [],
    loading,
    error,
    refetch,
    updateCommand,
    addCommand,
    removeCommand,
  }
}

// ユーザー設定専用Hook
export function useUserSettings(forceFresh = false) {
  const { data, loading, error, refetch } = useSection(
    CACHE_SECTIONS.USER_SETTINGS,
    forceFresh,
  )

  const updateUserSettings = useCallback(
    async (updater: (settings: UserSettings) => UserSettings) => {
      await enhancedSettings.updateSection<UserSettings>(
        CACHE_SECTIONS.USER_SETTINGS,
        updater,
      )
    },
    [],
  )

  return {
    userSettings: (data || {}) as UserSettings,
    loading,
    error,
    refetch,
    updateUserSettings,
  }
}

// 統合設定Hook（必要なセクションのみ指定）
export function useEnhancedSetting(
  sections: CacheSection[] = [
    CACHE_SECTIONS.COMMANDS,
    CACHE_SECTIONS.USER_SETTINGS,
  ],
  forceFresh = false,
): {
  settings: Partial<SettingsType>
  pageRule: PageRule | undefined
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  invalidateCache: (sectionsToInvalidate?: CacheSection[]) => void
} {
  const [settings, setSettings] = useState<Partial<SettingsType>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const mountedRef = useRef(true)
  const sectionsRef = useRef(sections)

  // sectionsが変更された場合の更新
  useEffect(() => {
    sectionsRef.current = sections
  }, [sections])

  const loadSettings = useCallback(async () => {
    if (!mountedRef.current) return

    try {
      setLoading(true)
      setError(null)

      const data = await enhancedSettings.get({
        sections: sectionsRef.current,
        forceFresh,
      })

      if (mountedRef.current) {
        setSettings(data)
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [forceFresh])

  const refetch = useCallback(async () => {
    await loadSettings()
  }, [loadSettings])

  const invalidateCache = useCallback(
    (sectionsToInvalidate?: CacheSection[]) => {
      const targetSections = sectionsToInvalidate || sectionsRef.current
      enhancedSettings.invalidateCache(targetSections)
    },
    [],
  )

  // sections を文字列化してメモ化（配列の参照変更による無限ループを防ぐ）
  const sectionsKey = useMemo(() => sections.join(','), [sections])

  // 初回ロード
  useEffect(() => {
    mountedRef.current = true
    loadSettings()
  }, [sectionsKey, forceFresh])

  // 変更監視の設定
  useEffect(() => {
    const handleChange = () => {
      if (mountedRef.current) {
        loadSettings()
      }
    }

    sections.forEach((section) => {
      settingsCache.subscribe(section, handleChange)
    })

    return () => {
      sections.forEach((section) => {
        settingsCache.unsubscribe(section, handleChange)
      })
    }
  }, [sectionsKey, loadSettings])

  // クリーンアップ
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  // ページルール計算
  let pageRule: PageRule | undefined
  if (settings && typeof window !== 'undefined') {
    pageRule = (settings.pageRules || [])
      .filter((r) => !isEmpty(r.urlPattern))
      .find((rule) => {
        try {
          const re = new RegExp(rule.urlPattern)
          return window.location.href.match(re) != null
        } catch {
          return false
        }
      })

    if (
      pageRule != null &&
      pageRule.popupPlacement !== INHERIT &&
      settings.popupPlacement
    ) {
      settings.popupPlacement = pageRule.popupPlacement
    }
  }

  return {
    settings,
    pageRule,
    loading,
    error,
    refetch,
    invalidateCache,
  }
}

// 従来のuseSetting Hookとの互換性を保つためのHook
export function useCompatibleSetting(): {
  settings: SettingsType
  pageRule: PageRule | undefined
  iconUrls: Record<number | string, string>
} {
  const { settings, pageRule, loading } = useEnhancedSetting([
    CACHE_SECTIONS.COMMANDS,
    CACHE_SECTIONS.USER_SETTINGS,
    CACHE_SECTIONS.STARS,
    CACHE_SECTIONS.SHORTCUTS,
    CACHE_SECTIONS.USER_STATS,
    CACHE_SECTIONS.CACHES,
  ])

  // IconUrls計算（既存の実装に合わせる）
  const iconUrls = (settings.commands || []).reduce(
    (acc, cur) => ({ ...acc, [cur.id]: cur.iconUrl }),
    {} as Record<number | string, string>,
  )

  // loadingが完了するまでemptySettingsを返す（既存の実装に合わせる）
  if (loading || !settings.commands) {
    return {
      settings: emptySettings,
      pageRule: undefined,
      iconUrls: {},
    }
  }

  return {
    settings: settings as SettingsType,
    pageRule,
    iconUrls,
  }
}

// パフォーマンス監視Hook
export function useSettingsPerformance() {
  const [cacheStatus, setCacheStatus] = useState<Record<string, any>>({})

  const updateCacheStatus = useCallback(() => {
    setCacheStatus(enhancedSettings.getCacheStatus())
  }, [])

  useEffect(() => {
    updateCacheStatus()
    const interval = setInterval(updateCacheStatus, 1000)
    return () => clearInterval(interval)
  }, [updateCacheStatus])

  return {
    cacheStatus,
    refreshStatus: updateCacheStatus,
  }
}
