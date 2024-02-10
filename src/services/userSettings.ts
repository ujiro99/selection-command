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

export const UserSettings = {
  get: async (): Promise<UserSettingsType> => {
    let obj = await Storage.get<UserSettingsType>(STORAGE_KEY.USER)
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

  set: async (data: UserSettingsType): Promise<boolean> => {
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
