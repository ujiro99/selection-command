import { Placement } from '@popperjs/core'
import { Storage, STORAGE_KEY } from './storage'
import UseSetting from './defaultUserSettings.json'
import { OPEN_MODE } from '../const'

export type Command = {
  id: number
  title: string
  searchUrl: string
  iconUrl: string
  openMode: OPEN_MODE
}

export type UseSettingsType = {
  commands: Array<Command>
  popupPlacement: Placement
  ignoreUrls: Array<string>
}

export const UseSettings = {
  get: async (): Promise<UseSettingsType> => {
    let obj = (await Storage.get(STORAGE_KEY.USER)) as UseSettingsType
    // Assigning IDs to each command
    obj.commands = obj.commands
      .map((c, idx) => {
        c.id = idx
        return c
      })
      .filter((c) => c.searchUrl != null)
    return obj
  },

  reset: async () => {
    await Storage.set(STORAGE_KEY.USER, UseSetting)
  },
}
