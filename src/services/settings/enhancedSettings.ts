import type {
  SettingsType,
  Command,
  Star,
  UserStats,
  ShortcutSettings,
  UserSettings,
} from "@/types"
import { settingsCache, CacheSection, CACHE_SECTIONS } from "./settingsCache"
import { Settings } from "./settings"
import { OptionSettings } from "@/services/option/optionSettings"
import DefaultSettings from "@/services/option/defaultSettings"
import { OPTION_FOLDER } from "@/const"

// Settings fetch options
interface GetSettingsOptions {
  sections?: CacheSection[]
  forceFresh?: boolean
  excludeOptions?: boolean
}

// Enhanced settings service
export class EnhancedSettings {
  constructor() {
    // Set up legacy listeners for cache invalidation
    this.setupLegacyListeners()
  }

  // Get integrated settings (with cache utilization)
  async get(options: GetSettingsOptions = {}): Promise<SettingsType> {
    const {
      sections = [
        CACHE_SECTIONS.COMMANDS,
        CACHE_SECTIONS.USER_SETTINGS,
        CACHE_SECTIONS.STARS,
        CACHE_SECTIONS.SHORTCUTS,
        CACHE_SECTIONS.USER_STATS,
      ],
      forceFresh = false,
      excludeOptions = false,
    } = options

    // Get sections in parallel
    const results = await Promise.allSettled([
      sections.includes(CACHE_SECTIONS.COMMANDS)
        ? settingsCache.get<Command[]>(CACHE_SECTIONS.COMMANDS, forceFresh)
        : Promise.resolve([]),
      sections.includes(CACHE_SECTIONS.USER_SETTINGS)
        ? settingsCache.get<UserSettings>(
            CACHE_SECTIONS.USER_SETTINGS,
            forceFresh,
          )
        : Promise.resolve(DefaultSettings as UserSettings),
      sections.includes(CACHE_SECTIONS.STARS)
        ? settingsCache.get<Star[]>(CACHE_SECTIONS.STARS, forceFresh)
        : Promise.resolve([]),
      sections.includes(CACHE_SECTIONS.SHORTCUTS)
        ? settingsCache.get<ShortcutSettings>(
            CACHE_SECTIONS.SHORTCUTS,
            forceFresh,
          )
        : Promise.resolve({ shortcuts: [] }),
      sections.includes(CACHE_SECTIONS.USER_STATS)
        ? settingsCache.get<UserStats>(CACHE_SECTIONS.USER_STATS, forceFresh)
        : Promise.resolve({
            commandExecutionCount: 0,
            hasShownReviewRequest: false,
          }),
    ])

    // Process results
    const [
      commandsResult,
      userSettingsResult,
      starsResult,
      shortcutsResult,
      userStatsResult,
    ] = results

    const commands =
      commandsResult.status === "fulfilled" ? commandsResult.value : []
    const userSettings =
      userSettingsResult.status === "fulfilled"
        ? userSettingsResult.value
        : (DefaultSettings as UserSettings)
    const stars = starsResult.status === "fulfilled" ? starsResult.value : []
    const shortcuts =
      shortcutsResult.status === "fulfilled"
        ? shortcutsResult.value
        : { shortcuts: [] }
    const userStats =
      userStatsResult.status === "fulfilled"
        ? userStatsResult.value
        : { commandExecutionCount: 0, hasShownReviewRequest: false }

    // Merge settings
    const mergedSettings = this.mergeSettings({
      commands,
      userSettings,
      stars,
      shortcuts,
      userStats,
    })

    // Filter folders
    mergedSettings.folders = mergedSettings.folders.filter(
      (folder) => !!folder.title,
    )

    // Process option settings
    if (!excludeOptions) {
      this.removeOptionSettings(mergedSettings)
      mergedSettings.folders.push(OptionSettings.folder)
      mergedSettings.commands.push(...OptionSettings.commands)
    }

    return mergedSettings
  }

  // Get partial settings
  async getSection<K extends CacheSection>(
    section: K,
    forceFresh = false,
  ): Promise<
    K extends "commands"
      ? Command[]
      : K extends "userSettings"
        ? UserSettings
        : K extends "stars"
          ? Star[]
          : K extends "shortcuts"
            ? ShortcutSettings
            : K extends "userStats"
              ? UserStats
              : any
  > {
    // Special handling for USER_SETTINGS to merge commands data
    if (section === CACHE_SECTIONS.USER_SETTINGS) {
      const [userSettings, commands] = await Promise.all([
        settingsCache.get<UserSettings>(
          CACHE_SECTIONS.USER_SETTINGS,
          forceFresh,
        ),
        settingsCache.get<Command[]>(CACHE_SECTIONS.COMMANDS, forceFresh),
      ])

      // Process option settings
      const mergedSettings = { ...userSettings, commands } as SettingsType
      this.removeOptionSettings(mergedSettings)
      mergedSettings.folders.push(OptionSettings.folder)
      mergedSettings.commands.push(...OptionSettings.commands)

      return mergedSettings as any
    }

    return settingsCache.get(section, forceFresh)
  }

  // Merge settings
  private mergeSettings(data: {
    commands: Command[]
    userSettings: UserSettings
    stars: Star[]
    shortcuts: ShortcutSettings
    userStats: UserStats
  }): SettingsType {
    return {
      ...data.userSettings,
      commands: data.commands,
      stars: data.stars,
      shortcuts: data.shortcuts,
      commandExecutionCount: data.userStats.commandExecutionCount,
      hasShownReviewRequest: data.userStats.hasShownReviewRequest,
    } as SettingsType
  }

  // Remove option settings
  private removeOptionSettings(data: SettingsType): void {
    data.commands = data.commands.filter(
      (c) => c?.parentFolderId !== OPTION_FOLDER,
    )
    data.folders = data.folders.filter((f) => f.id !== OPTION_FOLDER)
  }

  // Invalidate cache
  invalidateCache(sections: CacheSection[]): void {
    settingsCache.invalidate(sections)
  }

  // Invalidate all cache
  invalidateAllCache(): void {
    settingsCache.invalidateAll()
  }

  // Setup legacy listeners
  private setupLegacyListeners(): void {
    // Handle legacy Settings.addChangedListener
    Settings.addChangedListener(() => {
      // Invalidate all cache (safety measure)
      this.invalidateAllCache()
    })
  }

  // For debugging
  getCacheStatus() {
    return settingsCache.getCacheStatus()
  }
}

// Singleton instance
export const enhancedSettings = new EnhancedSettings()
