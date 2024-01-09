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
  popupPlacement: string
  ignoreUrls: Array<string>
}

export const UseSettings = {
  get: async (): Promise<UseSettingsType> => {
    let obj = (await Storage.get(STORAGE_KEY.USER)) as UseSettingsType
    // Assigning IDs to each command
    obj.commands = obj.commands.map((c, idx) => {
      c.id = idx
      return c
    })
    return obj
  },

  reset: async () => {
    await Storage.set(STORAGE_KEY.USER, UseSetting)
  },
}
