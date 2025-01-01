import { Storage, STORAGE_KEY, STORAGE_AREA } from './storage'
import DefaultSettings, { DefaultCommands } from './defaultSettings'
import {
  OPTION_FOLDER,
  STARTUP_METHOD,
  VERSION,
  LINK_COMMAND_STARTUP_METHOD,
} from '@/const'
import type { SettingsType, Version, Command, Star } from '@/types'
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
Storage.addListener(STORAGE_KEY.USER, async (newVal: unknown) => {
  const settings = newVal as SettingsType
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
    data.stars = await Storage.get<Star[]>(
      LOCAL_STORAGE_KEY.STARS,
      STORAGE_AREA.LOCAL,
    )

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
    await Storage.set(LOCAL_STORAGE_KEY.STARS, data.stars, STORAGE_AREA.LOCAL)
    data.stars = []

    await Storage.set(STORAGE_KEY.USER, data)
    await Storage.set(LOCAL_STORAGE_KEY.CACHES, caches, STORAGE_AREA.LOCAL)
    return true
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
  },

  addChangedListener: (callback: (data: SettingsType) => void) => {
    callbacks.push(callback)
  },

  removeChangedListener: (callback: (data: SettingsType) => void) => {
    const idx = callbacks.indexOf(callback)
    if (idx !== -1) callbacks.splice(idx, 1)
  },

  getCaches: async (): Promise<Caches> => {
    return Storage.get<Caches>(LOCAL_STORAGE_KEY.CACHES, STORAGE_AREA.LOCAL)
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
  if (data.settingVersion == null) {
    data = migrate073(data)
  }
  if (versionDiff(data.settingVersion, '0.8.2') === VersionDiff.Old) {
    data = migrate082(data)
  }
  if (versionDiff(data.settingVersion, '0.10.0') === VersionDiff.Old) {
    data = await migrate0_10_0(data)
  }
  if (versionDiff(data.settingVersion, '0.10.3') === VersionDiff.Old) {
    data = migrate0_10_3(data)
  }
  if (versionDiff(data.settingVersion, '0.11.3') === VersionDiff.Old) {
    data.settingVersion = VERSION as Version
    data = migrate0_11_3(data)
  }
  return data
}

const migrate073 = (data: SettingsType): SettingsType => {
  if (data.startupMethod == null) {
    data.startupMethod = DefaultSettings.startupMethod as {
      method: STARTUP_METHOD
    }
  }
  return data
}

const migrate082 = (data: SettingsType): SettingsType => {
  // parentFolder -> parentFolderId
  data.commands = data.commands.map((c) => {
    if (c.parentFolder != null) {
      c.parentFolderId = c.parentFolder.id
      delete c.parentFolder
    }
    return c
  })
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
