import { Storage, STORAGE_KEY, LOCAL_STORAGE_KEY } from "../storage"
import type { UserStats, ShortcutSettings, UserSettings, Caches } from "@/types"

import { CMD_PREFIX } from "@/services/storage/const"

// Cache section constants
export const CACHE_SECTIONS = {
  COMMANDS: "commands",
  USER_SETTINGS: "userSettings",
  STARS: "stars",
  SHORTCUTS: "shortcuts",
  USER_STATS: "userStats",
  CACHES: "caches",
} as const

// Cache section definition
export type CacheSection =
  | typeof CACHE_SECTIONS.COMMANDS
  | typeof CACHE_SECTIONS.USER_SETTINGS
  | typeof CACHE_SECTIONS.STARS
  | typeof CACHE_SECTIONS.SHORTCUTS
  | typeof CACHE_SECTIONS.USER_STATS
  | typeof CACHE_SECTIONS.CACHES

// Cache entry (internal use)
interface CacheEntry<T> {
  data: T
  timestamp: number
  version: string
  ttl?: number
}

// Version management (internal use)
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
    return Math.abs(hash).toString(16).padStart(8, "0")
  }
}

// Settings cache manager
export class SettingsCacheManager {
  private cache = new Map<CacheSection, CacheEntry<any>>()
  private versionManager = new DataVersionManager()
  private listeners = new Map<CacheSection, Set<() => void>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
  private storageListenerSetup = false
  private debounceTimers = new Map<CacheSection, NodeJS.Timeout>()
  private readonly DEBOUNCE_DELAY = 5 // ms

  // Storage key to cache section mapping
  private readonly storageKeyMapping = new Map<string, CacheSection>([
    [STORAGE_KEY.USER.toString(), CACHE_SECTIONS.USER_SETTINGS],
    [STORAGE_KEY.USER_STATS.toString(), CACHE_SECTIONS.USER_STATS],
    [STORAGE_KEY.SHORTCUTS.toString(), CACHE_SECTIONS.SHORTCUTS],
    [LOCAL_STORAGE_KEY.STARS, CACHE_SECTIONS.STARS],
    [LOCAL_STORAGE_KEY.CACHES, CACHE_SECTIONS.CACHES],
  ])

  constructor() {
    this.setupStorageListener()
  }

  // Get data by section
  async get<T>(section: CacheSection, forceFresh = false): Promise<T> {
    if (!forceFresh && this.isValid(section)) {
      // console.debug(`Cache hit for ${section}`)
      return this.cache.get(section)!.data
    }

    const data = await this.loadFromStorage<T>(section)
    this.setCache(section, data)
    return data
  }

  // Set cache
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

  // Check cache validity
  private isValid(section: CacheSection): boolean {
    const entry = this.cache.get(section)
    if (!entry) return false

    const now = Date.now()
    const isExpired = entry.ttl && now - entry.timestamp > entry.ttl

    return !isExpired
  }

  // Invalidate by section
  invalidate(sections: CacheSection[]): void {
    // console.info(`Invalidating cache for sections: ${sections.join(", ")}`)
    sections.forEach((section) => {
      this.cache.delete(section)
      this.versionManager.setVersion(section, "")
      this.notifyListeners(section)
    })
  }

  // Invalidate all cache
  invalidateAll(): void {
    const allSections = Array.from(this.cache.keys())
    this.invalidate(allSections)
  }

  // Subscribe to changes
  subscribe(section: CacheSection, callback: () => void): void {
    if (!this.listeners.has(section)) {
      this.listeners.set(section, new Set())
    }
    this.listeners.get(section)!.add(callback)
  }

  // Unsubscribe from changes
  unsubscribe(section: CacheSection, callback: () => void): void {
    const sectionListeners = this.listeners.get(section)
    if (sectionListeners) {
      sectionListeners.delete(callback)
      if (sectionListeners.size === 0) {
        this.listeners.delete(section)
      }
    }
  }

  // Notify listeners
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

  // Load data from storage
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
        return (await Storage.get<Caches>(LOCAL_STORAGE_KEY.CACHES)) as T

      default:
        throw new Error(`Unknown cache section: ${section}`)
    }
  }

  // Setup storage change monitoring
  private setupStorageListener(): void {
    if (this.storageListenerSetup) return

    // Monitor Chrome storage changes
    chrome.storage.onChanged.addListener((changes, _areaName) => {
      // console.debug("Storage changes detected:", changes, _areaName)
      const sectionsToInvalidate = new Set<CacheSection>()

      for (const key of Object.keys(changes)) {
        const section = this.storageKeyMapping.get(key)
        if (section) {
          sectionsToInvalidate.add(section)
        }
        // Command prefix check
        else if (key.startsWith(CMD_PREFIX)) {
          sectionsToInvalidate.add(CACHE_SECTIONS.COMMANDS)
        }
      }
      // Debounce processing
      sectionsToInvalidate.forEach((section) => {
        this.debounceInvalidation(section)
      })
    })

    this.storageListenerSetup = true
  }

  private debounceInvalidation(section: CacheSection): void {
    const existingTimer = this.debounceTimers.get(section)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }
    const timer = setTimeout(() => {
      // console.debug(`Debounced invalidation for section: ${section}`)
      this.invalidate([section])
      this.debounceTimers.delete(section)
    }, this.DEBOUNCE_DELAY)

    this.debounceTimers.set(section, timer)
  }

  // For debugging: Check cache status
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

// Singleton instance
export const settingsCache = new SettingsCacheManager()
