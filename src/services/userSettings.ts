import { Placement } from '@popperjs/core'
import { Storage, STORAGE_KEY } from './storage'
import UseSetting from './defaultUserSettings.json'
import { OPEN_MODE, POPUP_ENABLED, STYLE } from '../const'

export type Command = {
  id: number
  title: string
  searchUrl: string
  iconUrl: string
  openMode: OPEN_MODE
  parentFolderId: string
}

export type CommandFolder = {
  id: string
  title: string
  iconUrl: string
  onlyIcon: boolean
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

export const UserSettings = {
  get: async (): Promise<UserSettingsType> => {
    let obj = (await Storage.get(STORAGE_KEY.USER)) as UserSettingsType
    // Assigning IDs to each command
    obj.commands = obj.commands
      .map((c, idx) => {
        c.id = idx
        return c
      })
      .filter((c) => c.searchUrl != null)
    obj.folders = obj.folders.filter((folder) => !!folder.title)
    return obj
  },

  reset: async () => {
    await Storage.set(STORAGE_KEY.USER, UseSetting)
  },
}
