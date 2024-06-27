import type { Placement } from '@floating-ui/react'
import { Storage, STORAGE_KEY, STORAGE_AREA } from './storage'
import type { onChangedCallback } from './storage'
import DefaultSetting from './defaultUserSettings.json'
import type { OPEN_MODE, POPUP_ENABLED, STYLE } from '../const'
import { isBase64, isUrl } from '@/services/util'

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

export type UserSettingsType = {
  popupPlacement: Placement
  commands: Array<Command>
  folders: Array<CommandFolder>
  pageRules: Array<PageRule>
  style: STYLE
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
  get: async (): Promise<UserSettingsType> => {
    const caches = await UserSettings.getCaches()
    const obj = await Storage.get<UserSettingsType>(STORAGE_KEY.USER)
    obj.commands = obj.commands.map((c, idx) => {
      // Assigning IDs to each command
      c.id = idx
      // CacheId to image data url for Option screen.
      if (!isUrl(c.iconUrl)) {
        c.iconUrl = caches.images[c.iconUrl]
      }
      return c
    })
    obj.folders = obj.folders.filter((folder) => !!folder.title)
    return obj
  },

  set: async (data: UserSettingsType, newCaches?: Caches): Promise<boolean> => {
    // image data url to cache id.
    let caches = newCaches
    if (!caches) {
      caches = await UserSettings.getCaches()
    }
    // console.debug('update settings', data, caches)
    for (const c of data.commands) {
      if (!c.iconUrl) continue
      if (isBase64(c.iconUrl)) {
        const cache = Object.entries(caches.images).find(
          ([k, v]) => v === c.iconUrl,
        )
        if (cache) {
          c.iconUrl = cache[0]
        }
      }
    }
    const urls = UserSettings.getUrls(data)
    // remove unused caches
    for (const key in caches.images) {
      if (!urls.includes(key)) {
        console.debug('remove unused cache', key)
        delete caches.images[key]
      }
    }
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
    return [...iconUrls, ...folderIconUrls] as string[]
  },
}

export const migrate = async () => {
  await migrate060()
}

const migrate060 = async () => {
  console.warn(
    'Update the storage location of the configuration data to the cloud.',
  )
  // moveStorageSync
  const res = await chrome.storage.local.get(`${STORAGE_KEY.USER}`)
  const settings = res[`${STORAGE_KEY.USER}`]
  const sync = await chrome.storage.sync.get(`${STORAGE_KEY.USER}`)
  const syncSettings = sync[`${STORAGE_KEY.USER}`]
  if (!settings || syncSettings) {
    console.warn('Allready finished.')
    return
  }

  // cache image data url to local storage
  const caches = {} as ImageCache
  for (const c of settings.commands) {
    if (!c.iconUrl) continue
    if (isBase64(c.iconUrl)) {
      const id = crypto.randomUUID()
      const data = c.iconUrl
      caches[id] = data
      c.iconUrl = id
    }
  }
  await chrome.storage.local.set({
    [LOCAL_STORAGE_KEY.CACHES]: { images: caches },
  })
  await Storage.set(STORAGE_KEY.USER, settings)
  await chrome.storage.local.remove(`${STORAGE_KEY.USER}`)
  console.warn('Successfully finished.')
}
