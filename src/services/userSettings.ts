import type { Placement } from '@popperjs/core'
import { Storage, STORAGE_KEY, STORAGE_AREA } from './storage'
import UseSetting from './defaultUserSettings.json'
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
  fetchOptions?: string
  variables?: Array<CommandVariable>
}

export type PopupOption = {
  width: number
  height: number
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

type Caches = {
  images: ImageCache
}

type ImageCache = {
  [id: string]: string // key: url or uuid, value: data:image/png;base64
}

export const UserSettings = {
  get: async (): Promise<UserSettingsType> => {
    const caches = await Storage.get<Caches>(
      LOCAL_STORAGE_KEY.CACHES,
      STORAGE_AREA.LOCAL,
    )
    const obj = await Storage.get<UserSettingsType>(STORAGE_KEY.USER)
    obj.commands = obj.commands.map((c, idx) => {
      // Assigning IDs to each command
      c.id = idx
      // cache id to image data url .
      if (!isUrl(c.iconUrl)) {
        c.iconUrl = caches.images[c.iconUrl]
      }
      return c
    })
    obj.folders = obj.folders.filter((folder) => !!folder.title)
    return obj
  },

  set: async (data: UserSettingsType): Promise<boolean> => {
    const caches = await Storage.get<Caches>(
      LOCAL_STORAGE_KEY.CACHES,
      STORAGE_AREA.LOCAL,
    )

    // image data url to cache id.
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

    await Storage.set(STORAGE_KEY.USER, data)
    return true
  },

  reset: async () => {
    await Storage.set(STORAGE_KEY.USER, UseSetting)
  },

  onChanged: (callback: (data: UserSettingsType) => void) => {
    Storage.addListener(STORAGE_KEY.USER, callback)
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
  const settings = await Storage.get<UserSettingsType>(
    STORAGE_KEY.USER,
    STORAGE_AREA.LOCAL,
  )
  if (!settings) return

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
}
