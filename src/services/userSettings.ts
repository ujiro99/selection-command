import { Storage, STORAGE_KEY, STORAGE_AREA } from './storage'
import DefaultSettings, { DefaultCommands } from './defaultUserSettings'
import { OPTION_FOLDER, STARTUP_METHOD, VERSION } from '@/const'
import type { UserSettingsType, Version, Command } from '@/types'
import { isBase64, isEmpty, toDataURL } from '@/services/util'
import { OptionSettings } from '@/services/optionSettings'

enum LOCAL_STORAGE_KEY {
  CACHES = 'caches',
}

export type Caches = {
  images: ImageCache
}

export type ImageCache = {
  [id: string]: string // key: url or uuid, value: data:image/png;base64
}

const callbacks = [] as ((data: UserSettingsType) => void)[]
Storage.addListener(STORAGE_KEY.USER, async (newVal: unknown) => {
  const settings = newVal as UserSettingsType
  settings.commands = await Storage.getCommands()
  callbacks.forEach((cb) => cb(settings))
})
Storage.addCommandListener(async (commands: Command[]) => {
  const settings = await UserSettings.get()
  settings.commands = commands
  callbacks.forEach((cb) => cb(settings))
})

export const UserSettings = {
  get: async (excludeOptions = false): Promise<UserSettingsType> => {
    let obj = await Storage.get<UserSettingsType>(STORAGE_KEY.USER)
    if (obj.settingVersion == null) {
      obj = migrate073(obj)
    }
    obj.commands = await Storage.getCommands()
    obj.folders = obj.folders.filter((folder) => !!folder.title)
    if (!excludeOptions) {
      // Remove once to avoid duplication.
      removeOptionSettings(obj)
      // Add option settings
      obj.commands.push(...OptionSettings.commands)
      obj.folders.push(OptionSettings.folder)
    }
    return obj
  },

  set: async (data: UserSettingsType): Promise<boolean> => {
    data = migrate081(data)

    // remove unused caches
    const urls = UserSettings.getUrls(data)
    const caches = await UserSettings.getCaches()
    for (const key in caches.images) {
      if (!urls.includes(key)) {
        console.debug('remove unused cache', key)
        delete caches.images[key]
      }
    }

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

    // Settings for options are kept separate from user set values.
    removeOptionSettings(data)

    await Storage.setCommands(data.commands)
    data.commands = []
    await Storage.set(STORAGE_KEY.USER, data)
    await Storage.set(LOCAL_STORAGE_KEY.CACHES, caches, STORAGE_AREA.LOCAL)
    return true
  },

  reset: async () => {
    await Storage.set(STORAGE_KEY.USER, DefaultSettings)
    await Storage.setCommands(DefaultCommands)
  },

  addChangedListener: (callback: (data: UserSettingsType) => void) => {
    callbacks.push(callback)
  },

  removeChangedListener: (callback: (data: UserSettingsType) => void) => {
    const idx = callbacks.indexOf(callback)
    if (idx !== -1) callbacks.splice(idx, 1)
  },

  getCaches: async (): Promise<Caches> => {
    return Storage.get<Caches>(LOCAL_STORAGE_KEY.CACHES, STORAGE_AREA.LOCAL)
  },

  getUrls: (settings: UserSettingsType): string[] => {
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

const removeOptionSettings = (data: UserSettingsType): void => {
  data.commands = data.commands.filter(
    (c) => c?.parentFolderId !== OPTION_FOLDER,
  )
  data.folders = data.folders.filter((f) => f.id !== OPTION_FOLDER)
}

const migrate073 = (data: UserSettingsType): UserSettingsType => {
  data.settingVersion = VERSION as Version
  if (data.startupMethod == null) {
    data.startupMethod = DefaultSettings.startupMethod as {
      method: STARTUP_METHOD
    }
  }
  return data
}

const migrate081 = (data: UserSettingsType): UserSettingsType => {
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
