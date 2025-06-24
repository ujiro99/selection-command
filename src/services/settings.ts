import { Storage, STORAGE_KEY } from './storage'
import DefaultSettings, {
  DefaultCommands,
  PopupPlacement,
} from './defaultSettings'
import {
  OPTION_FOLDER,
  VERSION,
  LINK_COMMAND_STARTUP_METHOD,
  LINK_COMMAND_ENABLED,
  SIDE,
  ALIGN,
} from '@/const'
import type {
  SettingsType,
  UserSettings,
  Version,
  Command,
  Star,
  UserStats,
  ShortcutSettings,
} from '@/types'
import {
  isBase64,
  isEmpty,
  versionDiff,
  VersionDiff,
  isLinkCommand,
} from '@/lib/utils'
import { toDataURL } from '@/services/dom'
import { OptionSettings } from '@/services/optionSettings'

enum LOCAL_STORAGE_KEY {
  CACHES = 'caches',
  STARS = 'stars',
}

export type Caches = {
  images: ImageCache
}

export type ImageCache = {
  [id: string]: string // key: url or uuid, value: data:image/png;base64
}

const callbacks = [] as ((data: SettingsType) => void)[]
Storage.addListener(STORAGE_KEY.USER, async (settings: SettingsType) => {
  settings.commands = await Storage.getCommands()
  callbacks.forEach((cb) => cb(settings))
})
Storage.addCommandListener(async (commands: Command[]) => {
  const settings = await Settings.get()
  settings.commands = commands
  callbacks.forEach((cb) => cb(settings))
})

export const Settings = {
  get: async (excludeOptions = false): Promise<SettingsType> => {
    let data = await Storage.get<SettingsType>(STORAGE_KEY.USER)
    const commands = await Storage.getCommands()
    if (commands.length > 0) {
      data.commands = commands
    }

    // Stars
    data.stars = await Storage.get<Star[]>(LOCAL_STORAGE_KEY.STARS)

    // UserStats
    const userStats = await Storage.get<UserStats>(STORAGE_KEY.USER_STATS)
    data = { ...data, ...userStats }

    // Shortcuts
    data.shortcuts = await Storage.get<ShortcutSettings>(STORAGE_KEY.SHORTCUTS)

    data = await migrate(data)

    data.folders = data.folders.filter((folder) => !!folder.title)
    if (!excludeOptions) {
      // Remove once to avoid duplication.
      removeOptionSettings(data)
      // Add option settings
      data.commands.push(...OptionSettings.commands)
      data.folders.push(OptionSettings.folder)
    }
    return data
  },

  set: async (data: SettingsType, serviceWorker = false): Promise<boolean> => {
    // remove unused caches
    const urls = Settings.getUrls(data)
    const caches = await Settings.getCaches()
    for (const key in caches.images) {
      if (!urls.includes(key)) {
        console.debug('remove unused cache', key)
        delete caches.images[key]
      }
    }

    if (!serviceWorker) {
      // Convert iconUrl to DataURL for cache.
      const noCacheUrls = urls
        .filter((url) => !isEmpty(url))
        .filter((url) => !isBase64(url) && caches.images[url] == null)
      const newCaches = await Promise.all(
        noCacheUrls.map(async (url) => {
          let dataUrl = ''
          try {
            dataUrl = await toDataURL(url)
          } catch (e) {
            console.warn('Failed to convert to data url', url)
            console.warn(e)
          }
          return [url, dataUrl]
        }),
      )
      for (const [iconUrl, dataUrl] of newCaches) {
        if (isEmpty(dataUrl)) continue
        caches.images[iconUrl] = dataUrl
      }
    }

    // Restore a link command if not exists.
    const linkCommands = data.commands.filter(isLinkCommand)
    if (linkCommands.length === 0) {
      const defaultLinkCommand = DefaultCommands.find(isLinkCommand)
      if (defaultLinkCommand != null) {
        data.commands.push(defaultLinkCommand)
      }
    }

    // Settings for options are kept separate from user set values.
    removeOptionSettings(data)

    // Commands
    await Storage.setCommands(data.commands)
    data.commands = []

    // Stars
    await Storage.set<Star[]>(LOCAL_STORAGE_KEY.STARS, data.stars)

    // Remove UserStats, stars and shortcuts from data
    const { commandExecutionCount, hasShownReviewRequest, stars, ...restData } =
      data

    const userStats: UserStats = {
      commandExecutionCount,
      hasShownReviewRequest,
    }

    await Storage.set<UserStats>(STORAGE_KEY.USER_STATS, userStats)
    await Storage.set<ShortcutSettings>(STORAGE_KEY.SHORTCUTS, data.shortcuts)
    await Storage.set<UserSettings>(STORAGE_KEY.USER, restData)
    await Storage.set(LOCAL_STORAGE_KEY.CACHES, caches)
    return true
  },

  update: async <T extends keyof SettingsType>(
    key: T,
    updater: (value: SettingsType[T]) => SettingsType[T],
    serviceWorker = false,
  ): Promise<boolean> => {
    const settings = await Settings.get()
    const updatedSettings = {
      ...settings,
      [key]: updater(settings[key]),
    }
    return Settings.set(updatedSettings, serviceWorker)
  },

  addCommands: async (commands: Command[]): Promise<boolean> => {
    const current = await Storage.getCommands()
    const newCommands = [...current, ...commands]
    await Storage.setCommands(newCommands)
    return true
  },

  updateCommands: async (commands: Command[]): Promise<boolean> => {
    await Storage.updateCommands(commands)
    return true
  },

  reset: async () => {
    await Storage.set(STORAGE_KEY.USER, DefaultSettings)
    await Storage.setCommands(DefaultCommands)
    await Storage.set<ShortcutSettings>(
      STORAGE_KEY.SHORTCUTS,
      DefaultSettings.shortcuts,
    )
  },

  addChangedListener: (callback: (data: SettingsType) => void) => {
    callbacks.push(callback)
  },

  removeChangedListener: (callback: (data: SettingsType) => void) => {
    const idx = callbacks.indexOf(callback)
    if (idx !== -1) callbacks.splice(idx, 1)
  },

  getCaches: async (): Promise<Caches> => {
    return Storage.get<Caches>(LOCAL_STORAGE_KEY.CACHES)
  },

  getUrls: (settings: SettingsType): string[] => {
    const iconUrls = settings.commands.map((c) => c.iconUrl)
    const folderIconUrls = settings.folders.map((f) => f.iconUrl)
    const optionIconUrls = OptionSettings.commands.map((c) => c.iconUrl)
    return [
      ...iconUrls,
      ...folderIconUrls,
      ...optionIconUrls,
      OptionSettings.folder.iconUrl,
    ] as string[]
  },
}

const removeOptionSettings = (data: SettingsType): void => {
  data.commands = data.commands.filter(
    (c) => c?.parentFolderId !== OPTION_FOLDER,
  )
  data.folders = data.folders.filter((f) => f.id !== OPTION_FOLDER)
}

export const migrate = async (data: SettingsType): Promise<SettingsType> => {
  if (versionDiff(data.settingVersion, '0.10.0') === VersionDiff.Old) {
    data = await migrate0_10_0(data)
  }
  if (versionDiff(data.settingVersion, '0.10.3') === VersionDiff.Old) {
    data = migrate0_10_3(data)
  }
  if (versionDiff(data.settingVersion, '0.11.3') === VersionDiff.Old) {
    data = migrate0_11_3(data)
  }
  if (versionDiff(data.settingVersion, '0.11.5') === VersionDiff.Old) {
    data.settingVersion = VERSION as Version
    data = migrate0_11_5(data)
  }
  if (versionDiff(data.settingVersion, '0.11.9') === VersionDiff.Old) {
    data.settingVersion = VERSION as Version
    data = migrate0_11_9(data)
  }

  return data
}

const migrate0_10_0 = async (data: SettingsType): Promise<SettingsType> => {
  // Add a link command if not exists.
  const linkCommands = data.commands.filter(isLinkCommand)
  if (linkCommands.length === 0) {
    const defaultLinkCommand = DefaultCommands.find(isLinkCommand)
    if (defaultLinkCommand != null) {
      data.commands.push(defaultLinkCommand)
      await Storage.setCommands(data.commands)
      console.debug('migrate 0.10.0 link command')
    }
  }
  return data
}

const migrate0_10_3 = (data: SettingsType): SettingsType => {
  // Add a linkCommand if not exists.
  if (data.linkCommand == null) {
    data.linkCommand = DefaultSettings.linkCommand
    console.debug('migrate 0.10.3 link command')
  }
  if (data.linkCommand.enabled == null) {
    data.linkCommand.enabled = DefaultSettings.linkCommand.enabled
    console.debug('migrate 0.10.3 link command enabled')
  }
  return data
}

const migrate0_11_3 = (data: SettingsType): SettingsType => {
  // 1. Add linkCommand.startUpMethod if not exists.
  if (data.linkCommand.startupMethod == null) {
    data.linkCommand.startupMethod = DefaultSettings.linkCommand.startupMethod
  }

  // 2. Move threshold to linkCommand.startUpMethod
  data.linkCommand.startupMethod = {
    ...data.linkCommand.startupMethod,
    threshold: (data.linkCommand as any).threshold,
  }
  delete (data.linkCommand as any).threshold

  // 3. Change startUpMethod to drag if linkCommand is enabled.
  if (data.linkCommand.enabled) {
    data.linkCommand.startupMethod.method = LINK_COMMAND_STARTUP_METHOD.DRAG
  }
  return data
}

const migrate0_11_5 = (data: SettingsType): SettingsType => {
  // 1. Convert id of comamnds to uuid
  data.commands = data.commands.map((c) => {
    if (c.id.length === 36) return c
    c.id =
      DefaultCommands.find((dc) => dc.title === c.title)?.id ??
      crypto.randomUUID()
    return c
  })

  // 2. PageRule: Set default value of linkCommandEnabled.
  data.pageRules = data.pageRules.map((pr) => {
    if (pr.linkCommandEnabled == null) {
      pr.linkCommandEnabled = LINK_COMMAND_ENABLED.INHERIT
    }
    return pr
  })

  return data
}

const migrate0_11_9 = (data: SettingsType): SettingsType => {
  // 1. Convert POPUP_PLACEMENT to PopupPlacement
  if (data.popupPlacement != null && typeof data.popupPlacement === 'string') {
    const [oldSide, oldAlign] = (data.popupPlacement as string).split('-')
    data.popupPlacement = {
      ...PopupPlacement,
      side: oldSide as SIDE,
      align: (oldAlign as ALIGN) ?? ALIGN.center,
    }
  }

  // 2. Convert POPUP_PLACEMENT to PopupPlacement as PageRules
  if (data.pageRules != null && Array.isArray(data.pageRules)) {
    data.pageRules = data.pageRules.map((pr) => {
      if (pr.popupPlacement != null && typeof pr.popupPlacement === 'string') {
        const [oldSide, oldAlign] = (pr.popupPlacement as string).split('-')
        pr.popupPlacement = {
          ...PopupPlacement,
          side: oldSide as SIDE,
          align: (oldAlign as ALIGN) ?? ALIGN.center,
        }
      }
      return pr
    })
  }

  return data
}
