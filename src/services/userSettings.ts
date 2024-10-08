import type { Placement } from '@floating-ui/react'
import { Storage, STORAGE_KEY, STORAGE_AREA } from './storage'
import type { onChangedCallback } from './storage'
import DefaultSetting from './defaultUserSettings.json'
import type { OPEN_MODE, POPUP_ENABLED, STYLE } from '@/const'
import { OPTION_FOLDER, STARTUP_METHOD, KEYBOARD, VERSION } from '@/const'
import { isBase64, isEmpty, toDataURL } from '@/services/util'
import { OptionSettings } from '@/services/optionSettings'

export type Version = `${number}.${number}.${number}`

export type Command = {
  id: number
  title: string
  searchUrl: string
  iconUrl: string
  openMode: OPEN_MODE
  openModeSecondary?: OPEN_MODE
  parentFolder?: FolderOption
  popupOption?: PopupOption
  copyOption?: CopyOption
  fetchOptions?: string
  variables?: Array<CommandVariable>
  spaceEncoding?: SPACE_ENCODING
}

export type PopupOption = {
  width: number
  height: number
}

export type CopyOption = 'default' | 'text'

export enum SPACE_ENCODING {
  PLUS = 'plus',
  PERCENT = 'percent',
}

export type FolderOption = {
  id: string
  name: string
  iconUrl: string
}

export type CommandFolder = {
  id: string
  title: string
  iconUrl?: string
  onlyIcon?: boolean
}

export type CommandVariable = {
  name: string
  value: string
}

export type PageRule = {
  urlPattern: string
  popupEnabled: POPUP_ENABLED
  popupPlacement: Placement
}

export enum STYLE_VARIABLE {
  BACKGROUND_COLOR = 'background-color',
  BORDER_COLOR = 'border-color',
  FONT_SCALE = 'font-scale',
  IMAGE_SCALE = 'image-scale',
  PADDING_SCALE = 'padding-scale',
  POPUP_DELAY = 'popup-delay',
  POPUP_DURATION = 'popup-duration',
}

export type StyleVariable = {
  name: STYLE_VARIABLE
  value: string
}

export type StartupMethod = {
  method: STARTUP_METHOD
  keyboardParam?: KEYBOARD
  leftClickHoldParam?: number
}

export type UserSettingsType = {
  settingVersion: Version
  startupMethod: StartupMethod
  popupPlacement: Placement
  commands: Array<Command>
  folders: Array<CommandFolder>
  pageRules: Array<PageRule>
  style: STYLE
  userStyles: Array<StyleVariable>
}

enum LOCAL_STORAGE_KEY {
  CACHES = 'caches',
}

export type Caches = {
  images: ImageCache
}

export type ImageCache = {
  [id: string]: string // key: url or uuid, value: data:image/png;base64
}

export const UserSettings = {
  get: async (excludeOptions = false): Promise<UserSettingsType> => {
    let obj = await Storage.get<UserSettingsType>(STORAGE_KEY.USER)
    if (obj.settingVersion == null) {
      obj = migrate073(obj)
    }
    obj.commands = obj.commands.map((c, idx) => {
      // Assigning IDs to each command
      c.id = idx
      return c
    })
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
    // console.debug('update settings', data)
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

    await Storage.set(STORAGE_KEY.USER, data)
    await Storage.set(LOCAL_STORAGE_KEY.CACHES, caches, STORAGE_AREA.LOCAL)
    return true
  },

  reset: async () => {
    await Storage.set(STORAGE_KEY.USER, DefaultSetting)
  },

  onChanged: (callback: (data: UserSettingsType) => void) => {
    Storage.addListener(STORAGE_KEY.USER, callback as onChangedCallback)
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
    (c) => c.parentFolder?.id !== OPTION_FOLDER,
  )
  data.folders = data.folders.filter((f) => f.id !== OPTION_FOLDER)
}

const migrate073 = (data: UserSettingsType): UserSettingsType => {
  data.settingVersion = VERSION as Version
  if (data.startupMethod == null) {
    data.startupMethod = DefaultSetting.startupMethod as {
      method: STARTUP_METHOD
    }
  }
  return data
}
