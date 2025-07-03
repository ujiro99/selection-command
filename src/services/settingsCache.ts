import { Storage, STORAGE_KEY, LOCAL_STORAGE_KEY } from './storage'
import type {
  UserStats,
  ShortcutSettings,
  UserSettings,
} from '@/types'
import { Settings } from './settings'

// キャッシュセクション定数
export const CACHE_SECTIONS = {
  COMMANDS: 'commands',
  USER_SETTINGS: 'userSettings',
  STARS: 'stars',
  SHORTCUTS: 'shortcuts',
  USER_STATS: 'userStats',
  CACHES: 'caches',
} as const

// キャッシュセクション定義
export type CacheSection =
  | typeof CACHE_SECTIONS.COMMANDS
  | typeof CACHE_SECTIONS.USER_SETTINGS
  | typeof CACHE_SECTIONS.STARS
  | typeof CACHE_SECTIONS.SHORTCUTS
  | typeof CACHE_SECTIONS.USER_STATS
  | typeof CACHE_SECTIONS.CACHES

// キャッシュエントリ
interface CacheEntry<T> {
  data: T
  timestamp: number
  version: string
  ttl?: number
}

// バージョン管理
class DataVersionManager {
  private versions = new Map<CacheSection, string>()

  generateVersion(section: CacheSection, data: any): string {
    const dataHash = this.hashData(data)
    const timestamp = Date.now()
    return `${section}-${timestamp}-${dataHash}`
  }

  setVersion(section: CacheSection, version: string): void {
    this.versions.set(section, version)
  }

  getVersion(section: CacheSection): string | undefined {
    return this.versions.get(section)
  }

  validateVersion(section: CacheSection, version: string): boolean {
    return this.versions.get(section) === version
  }

  private hashData(data: any): string {
    const normalized = JSON.stringify(data, Object.keys(data || {}).sort())
    let hash = 5381
    for (let i = 0; i < normalized.length; i++) {
      hash = (hash << 5) + hash + normalized.charCodeAt(i)
      hash = hash & hash
    }
    return Math.abs(hash).toString(16).padStart(8, '0')
  }
}

// 設定キャッシュマネージャー
export class SettingsCacheManager {
  private cache = new Map<CacheSection, CacheEntry<any>>()
  private versionManager = new DataVersionManager()
  private listeners = new Map<CacheSection, Set<() => void>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5分
  private storageListenerSetup = false

  constructor() {
    this.setupStorageListener()
  }

  // セクション別データ取得
  async get<T>(section: CacheSection, forceFresh = false): Promise<T> {
    if (!forceFresh && this.isValid(section)) {
      console.log(`Cache hit for ${section}`)
      return this.cache.get(section)!.data
    }

    console.log(`Loading ${section} from storage`)
    const data = await this.loadFromStorage<T>(section)
    this.setCache(section, data)
    return data
  }

  // キャッシュ設定
  private setCache<T>(section: CacheSection, data: T, ttl?: number): void {
    const version = this.versionManager.generateVersion(section, data)
    this.versionManager.setVersion(section, version)

    this.cache.set(section, {
      data,
      timestamp: Date.now(),
      version,
      ttl: ttl || this.DEFAULT_TTL,
    })
  }

  // キャッシュ有効性確認
  private isValid(section: CacheSection): boolean {
    const entry = this.cache.get(section)
    if (!entry) return false

    const now = Date.now()
    const isExpired = entry.ttl && now - entry.timestamp > entry.ttl

    return !isExpired
  }

  // セクション別無効化
  invalidate(sections: CacheSection[]): void {
    console.log(`Invalidating cache for sections: ${sections.join(', ')}`)
    sections.forEach((section) => {
      this.cache.delete(section)
      this.versionManager.setVersion(section, '')
      this.notifyListeners(section)
    })
  }

  // 全キャッシュ無効化
  invalidateAll(): void {
    const allSections = Array.from(this.cache.keys())
    this.invalidate(allSections)
  }

  // 変更監視登録
  subscribe(section: CacheSection, callback: () => void): void {
    if (!this.listeners.has(section)) {
      this.listeners.set(section, new Set())
    }
    this.listeners.get(section)!.add(callback)
  }

  // 変更監視解除
  unsubscribe(section: CacheSection, callback: () => void): void {
    const sectionListeners = this.listeners.get(section)
    if (sectionListeners) {
      sectionListeners.delete(callback)
      if (sectionListeners.size === 0) {
        this.listeners.delete(section)
      }
    }
  }

  // リスナー通知
  private notifyListeners(section: CacheSection): void {
    const sectionListeners = this.listeners.get(section)
    if (sectionListeners) {
      sectionListeners.forEach((callback) => {
        try {
          callback()
        } catch (error) {
          console.error(`Error in cache listener for ${section}:`, error)
        }
      })
    }
  }

  // ストレージからのデータ読み込み
  private async loadFromStorage<T>(section: CacheSection): Promise<T> {
    switch (section) {
      case CACHE_SECTIONS.COMMANDS:
        return (await Storage.getCommands()) as T

      case CACHE_SECTIONS.USER_SETTINGS:
        return (await Storage.get<UserSettings>(STORAGE_KEY.USER)) as T

      case CACHE_SECTIONS.STARS:
        return (await Storage.get(LOCAL_STORAGE_KEY.STARS)) as T

      case CACHE_SECTIONS.SHORTCUTS:
        return (await Storage.get<ShortcutSettings>(STORAGE_KEY.SHORTCUTS)) as T

      case CACHE_SECTIONS.USER_STATS:
        return (await Storage.get<UserStats>(STORAGE_KEY.USER_STATS)) as T

      case CACHE_SECTIONS.CACHES:
        return (await Settings.getCaches()) as T

      default:
        throw new Error(`Unknown cache section: ${section}`)
    }
  }

  // ストレージ変更監視設定
  private setupStorageListener(): void {
    if (this.storageListenerSetup) return

    // Chrome storage変更監視
    chrome.storage.onChanged.addListener((changes, areaName) => {
      console.log(`Storage changed in ${areaName}:`, Object.keys(changes))

      const sectionsToInvalidate: CacheSection[] = []

      for (const key of Object.keys(changes)) {
        if (key === STORAGE_KEY.USER.toString()) {
          sectionsToInvalidate.push(CACHE_SECTIONS.USER_SETTINGS)
        } else if (key === STORAGE_KEY.USER_STATS.toString()) {
          sectionsToInvalidate.push(CACHE_SECTIONS.USER_STATS)
        } else if (key === STORAGE_KEY.SHORTCUTS.toString()) {
          sectionsToInvalidate.push(CACHE_SECTIONS.SHORTCUTS)
        } else if (key === LOCAL_STORAGE_KEY.STARS) {
          sectionsToInvalidate.push(CACHE_SECTIONS.STARS)
        } else if (key === LOCAL_STORAGE_KEY.CACHES) {
          sectionsToInvalidate.push(CACHE_SECTIONS.CACHES)
        } else if (key.startsWith('cmd-')) {
          sectionsToInvalidate.push(CACHE_SECTIONS.COMMANDS)
        }
      }

      if (sectionsToInvalidate.length > 0) {
        this.invalidate([...new Set(sectionsToInvalidate)])
      }
    })

    this.storageListenerSetup = true
  }

  // デバッグ用：キャッシュ状態確認
  getCacheStatus(): Record<CacheSection, { cached: boolean; age: number }> {
    const status: Record<string, { cached: boolean; age: number }> = {}

    for (const [section, entry] of this.cache.entries()) {
      status[section] = {
        cached: true,
        age: Date.now() - entry.timestamp,
      }
    }

    return status as Record<CacheSection, { cached: boolean; age: number }>
  }
}

// シングルトンインスタンス
export const settingsCache = new SettingsCacheManager()
