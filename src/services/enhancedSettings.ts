import type {
  SettingsType,
  Command,
  Star,
  UserStats,
  ShortcutSettings,
  UserSettings,
} from '@/types'
import { settingsCache, CacheSection, CACHE_SECTIONS } from './settingsCache'
import { Settings } from './settings'
import { Storage, STORAGE_KEY, LOCAL_STORAGE_KEY } from './storage'
import { OptionSettings } from '@/services/option/optionSettings'
import DefaultSettings from '@/services/option/defaultSettings'
import { OPTION_FOLDER } from '@/const'

// 設定取得オプション
interface GetSettingsOptions {
  sections?: CacheSection[]
  forceFresh?: boolean
  excludeOptions?: boolean
}

// 部分設定型
type PartialSettingsType = {
  [K in keyof SettingsType]?: SettingsType[K]
}

// 強化された設定サービス
export class EnhancedSettings {
  constructor() {
    // 従来のリスナー設定をキャッシュ無効化に対応
    this.setupLegacyListeners()
  }

  // 統合設定取得（キャッシュ活用）
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

    console.log('EnhancedSettings.get called with sections:', sections)

    // 並列でセクション別取得
    const results = await Promise.allSettled([
      sections.includes(CACHE_SECTIONS.COMMANDS)
        ? settingsCache.get<Command[]>(CACHE_SECTIONS.COMMANDS, forceFresh)
        : Promise.resolve([]),
      sections.includes(CACHE_SECTIONS.USER_SETTINGS)
        ? settingsCache.get<UserSettings>(CACHE_SECTIONS.USER_SETTINGS, forceFresh)
        : Promise.resolve(DefaultSettings as UserSettings),
      sections.includes(CACHE_SECTIONS.STARS)
        ? settingsCache.get<Star[]>(CACHE_SECTIONS.STARS, forceFresh)
        : Promise.resolve([]),
      sections.includes(CACHE_SECTIONS.SHORTCUTS)
        ? settingsCache.get<ShortcutSettings>(CACHE_SECTIONS.SHORTCUTS, forceFresh)
        : Promise.resolve({ shortcuts: [] }),
      sections.includes(CACHE_SECTIONS.USER_STATS)
        ? settingsCache.get<UserStats>(CACHE_SECTIONS.USER_STATS, forceFresh)
        : Promise.resolve({
            commandExecutionCount: 0,
            hasShownReviewRequest: false,
          }),
    ])

    // 結果の処理
    const [
      commandsResult,
      userSettingsResult,
      starsResult,
      shortcutsResult,
      userStatsResult,
    ] = results

    const commands =
      commandsResult.status === 'fulfilled' ? commandsResult.value : []
    const userSettings =
      userSettingsResult.status === 'fulfilled' ? userSettingsResult.value : DefaultSettings as UserSettings
    const stars = starsResult.status === 'fulfilled' ? starsResult.value : []
    const shortcuts =
      shortcutsResult.status === 'fulfilled'
        ? shortcutsResult.value
        : { shortcuts: [] }
    const userStats =
      userStatsResult.status === 'fulfilled'
        ? userStatsResult.value
        : { commandExecutionCount: 0, hasShownReviewRequest: false }

    // 設定をマージ
    let mergedSettings = this.mergeSettings({
      commands,
      userSettings,
      stars,
      shortcuts,
      userStats,
    })

    // マイグレーション処理（コメントアウト - migrateメソッドが存在しない場合）
    // mergedSettings = await Settings.migrate(mergedSettings)

    // フォルダーのフィルタリング
    mergedSettings.folders = mergedSettings.folders.filter(
      (folder) => !!folder.title,
    )

    // オプション設定の処理
    if (!excludeOptions) {
      this.removeOptionSettings(mergedSettings)
      mergedSettings.commands.push(...OptionSettings.commands)
      mergedSettings.folders.push(OptionSettings.folder)
    }

    return mergedSettings
  }

  // 部分的な設定取得
  async getSection<K extends CacheSection>(
    section: K,
    forceFresh = false,
  ): Promise<
    K extends 'commands'
      ? Command[]
      : K extends 'userSettings'
        ? UserSettings
        : K extends 'stars'
          ? Star[]
          : K extends 'shortcuts'
            ? ShortcutSettings
            : K extends 'userStats'
              ? UserStats
              : any
  > {
    return settingsCache.get(section, forceFresh)
  }

  // セクション別更新
  async updateSection<T>(
    section: CacheSection,
    updater: (data: T) => T,
  ): Promise<void> {
    const currentData = await settingsCache.get<T>(section)
    const updatedData = updater(currentData)

    await this.saveToStorage(section, updatedData)
    settingsCache.invalidate([section])
  }

  // ストレージへの保存
  private async saveToStorage(section: CacheSection, data: any): Promise<void> {
    switch (section) {
      case CACHE_SECTIONS.COMMANDS:
        await Storage.setCommands(data as Command[])
        break

      case CACHE_SECTIONS.USER_SETTINGS:
        await Storage.set<UserSettings>(STORAGE_KEY.USER, data as UserSettings)
        break

      case CACHE_SECTIONS.STARS:
        await Storage.set(LOCAL_STORAGE_KEY.STARS, data as Star[])
        break

      case CACHE_SECTIONS.SHORTCUTS:
        await Storage.set<ShortcutSettings>(
          STORAGE_KEY.SHORTCUTS,
          data as ShortcutSettings,
        )
        break

      case CACHE_SECTIONS.USER_STATS:
        await Storage.set<UserStats>(STORAGE_KEY.USER_STATS, data as UserStats)
        break

      default:
        throw new Error(`Cannot save section: ${section}`)
    }
  }

  // 設定マージ
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

  // オプション設定の削除
  private removeOptionSettings(data: SettingsType): void {
    data.commands = data.commands.filter(
      (c) => c?.parentFolderId !== OPTION_FOLDER,
    )
    data.folders = data.folders.filter((f) => f.id !== OPTION_FOLDER)
  }

  // 変更監視
  addChangedListener(
    sections: CacheSection[],
    callback: (data: PartialSettingsType) => void,
  ): void {
    sections.forEach((section) => {
      settingsCache.subscribe(section, async () => {
        try {
          const data = await this.get({ sections })
          callback(data)
        } catch (error) {
          console.error(
            `Error in settings change listener for ${section}:`,
            error,
          )
        }
      })
    })
  }

  // 変更監視解除
  removeChangedListener(
    sections: CacheSection[],
    callback: () => void,
  ): void {
    sections.forEach((section) => {
      settingsCache.unsubscribe(section, callback)
    })
  }

  // キャッシュ無効化
  invalidateCache(sections: CacheSection[]): void {
    settingsCache.invalidate(sections)
  }

  // 全キャッシュ無効化
  invalidateAllCache(): void {
    settingsCache.invalidateAll()
  }

  // 従来の設定APIとの互換性保持
  async getLegacy(excludeOptions = false): Promise<SettingsType> {
    return this.get({ excludeOptions })
  }

  // 従来のset実装との互換性
  async setLegacy(data: SettingsType, serviceWorker = false): Promise<boolean> {
    return Settings.set(data, serviceWorker)
  }

  // 従来のupdate実装との互換性
  async updateLegacy<T extends keyof SettingsType>(
    key: T,
    updater: (value: SettingsType[T]) => SettingsType[T],
    serviceWorker = false,
  ): Promise<boolean> {
    return Settings.update(key, updater, serviceWorker)
  }

  // コマンド関連の操作
  async addCommands(commands: Command[]): Promise<boolean> {
    return Settings.addCommands(commands)
  }

  async updateCommands(commands: Command[]): Promise<boolean> {
    return Settings.updateCommands(commands)
  }

  // 設定リセット
  async reset(): Promise<void> {
    await Settings.reset()
    this.invalidateAllCache()
  }

  // キャッシュ関連
  async getCaches() {
    return settingsCache.get(CACHE_SECTIONS.CACHES)
  }

  // 従来リスナーの設定
  private setupLegacyListeners(): void {
    // 従来のSettings.addChangedListenerに対応
    Settings.addChangedListener((_data: SettingsType) => {
      // 全キャッシュを無効化（安全策）
      this.invalidateAllCache()
    })
  }

  // デバッグ用
  getCacheStatus() {
    return settingsCache.getCacheStatus()
  }
}

// シングルトンインスタンス
export const enhancedSettings = new EnhancedSettings()
