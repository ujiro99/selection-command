import DefaultSettings, { DefaultCommands } from './defaultUserSettings'
import { Command } from '@/types'

export enum STORAGE_KEY {
  USER = 0,
  BG = 1,
  COMMAND_COUNT = 2,
  MESSAGE_QUEUE = 3,
}

export enum LOCAL_STORAGE_KEY {
  CACHES = 'caches',
}

const CMD_PREFIX = 'cmd-'

const DEFAULT_COUNT = -1

const DEFAULTS = {
  [STORAGE_KEY.USER]: DefaultSettings,
  [STORAGE_KEY.BG]: {},
  [STORAGE_KEY.COMMAND_COUNT]: DEFAULT_COUNT,
  [STORAGE_KEY.MESSAGE_QUEUE]: [],
  [LOCAL_STORAGE_KEY.CACHES]: {
    images: {},
  },
}

export enum STORAGE_AREA {
  SYNC = 'sync',
  LOCAL = 'local',
}

export type ChangedCallback = (newVal: unknown, oldVal: unknown) => void
const changedCallbacks = {} as { [key: string]: ChangedCallback[] }

type commandChangedCallback = (commands: Command[]) => void
const commandChangedCallbacks = [] as commandChangedCallback[]

chrome.storage.onChanged.addListener((changes) => {
  const commands = [] as Command[]
  for (const [k, { oldValue, newValue }] of Object.entries(changes)) {
    for (const [kk, callbacks] of Object.entries(changedCallbacks)) {
      if (k === kk) callbacks.forEach((cb) => cb(newValue, oldValue))
    }
    if (k.startsWith(CMD_PREFIX)) commands.push(newValue)
  }
  if (commands.length > 0) {
    commandChangedCallbacks.forEach((cb) => cb(commands))
  }
})

export const Storage = {
  /**
   * Get a item from chrome sync storage.
   *
   * @param {STORAGE_KEY} key of item in storage.
   */
  get: async <T>(
    key: STORAGE_KEY | LOCAL_STORAGE_KEY,
    area = STORAGE_AREA.SYNC,
  ): Promise<T> => {
    let result = await chrome.storage[area].get(`${key}`)
    if (chrome.runtime.lastError != null) {
      throw chrome.runtime.lastError
    }
    return result[key] ?? structuredClone(DEFAULTS[key])
  },

  /**
   * Set a item to chrome sync storage.
   *
   * @param {string} key key of item.
   * @param {any} value item.
   */
  set: async (
    key: STORAGE_KEY | LOCAL_STORAGE_KEY,
    value: unknown,
    area = STORAGE_AREA.SYNC,
  ): Promise<boolean> => {
    await chrome.storage[area].set({ [key]: value })
    if (chrome.runtime.lastError != null) {
      throw chrome.runtime.lastError
    }
    return true
  },

  /**
   * Remove a item in chrome sync storage.
   *
   * @param {string} key key of item.
   */
  remove: (
    key: STORAGE_KEY | LOCAL_STORAGE_KEY,
    area = STORAGE_AREA.SYNC,
  ): Promise<boolean | chrome.runtime.LastError> => {
    return new Promise((resolve, reject) => {
      chrome.storage[area].remove(`${key}`, () => {
        if (chrome.runtime.lastError != null) {
          reject(chrome.runtime.lastError)
        } else {
          resolve(true)
        }
      })
    })
  },

  /**
   * Clear all items in chrome sync storage.
   */
  clear: (area = STORAGE_AREA.SYNC): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      chrome.storage[area].clear(() => {
        if (chrome.runtime.lastError != null) {
          reject(chrome.runtime.lastError)
        } else {
          resolve(true)
        }
      })
    })
  },

  addListener: (key: STORAGE_KEY, cb: ChangedCallback) => {
    changedCallbacks[key] = changedCallbacks[key] ?? []
    changedCallbacks[key].push(cb)
  },

  removeListener: (key: STORAGE_KEY, cb: ChangedCallback) => {
    changedCallbacks[key] = changedCallbacks[key]?.filter((f) => f !== cb)
  },

  commandKeys: async (): Promise<string[]> => {
    const count = await Storage.get<number>(STORAGE_KEY.COMMAND_COUNT)
    return Array.from({ length: count }, (_, i) => `${CMD_PREFIX}${i}`)
  },

  /**
   * Get all commands from chrome sync storage.
   *
   * @returns {Promise<Command[]>} commands
   * @throws {chrome.runtime.LastError} if error occurred
   */
  getCommands: async (): Promise<Command[]> => {
    // If first time, return DefaultCommands.
    const count = await Storage.get<number>(STORAGE_KEY.COMMAND_COUNT)
    if (count === DEFAULT_COUNT) return DefaultCommands

    const keys = await Storage.commandKeys()
    const res = await chrome.storage.sync.get(keys)
    if (chrome.runtime.lastError != null) {
      throw chrome.runtime.lastError
    }
    return keys.map((key) => res[key]).filter((cmd) => cmd != null)
  },

  /**
   * Set all commands to chrome sync storage.
   *
   * @returns {Promise<boolean>} true if success's
   * @throws {chrome.runtime.LastError} if error occurred
   */
  setCommands: async (
    commands: Command[],
  ): Promise<boolean | chrome.runtime.LastError> => {
    // Remove all commands first.
    await Storage.removeCommands()
    // Update command count.
    const count = commands.length
    await chrome.storage.sync.set({ [STORAGE_KEY.COMMAND_COUNT]: count })
    if (chrome.runtime.lastError != null) {
      throw chrome.runtime.lastError
    }
    // Update commands.
    const data = commands.reduce(
      (acc, cmd, i) => {
        cmd.id = i // Assigning IDs to each command
        acc[`${CMD_PREFIX}${i}`] = cmd
        return acc
      },
      {} as { [key: string]: Command },
    )
    await chrome.storage.sync.set(data)
    if (chrome.runtime.lastError != null) {
      throw chrome.runtime.lastError
    }
    return true
  },

  /**
   * Update commands to chrome sync storage.
   *
   * @returns {Promise<boolean>} true if success's
   * @throws {chrome.runtime.LastError} if error occurred
   */
  updateCommands: async (
    commands: Command[],
  ): Promise<boolean | chrome.runtime.LastError> => {
    const current = await Storage.getCommands()

    // If update first time, set DefaultCommands.
    const count = await Storage.get<number>(STORAGE_KEY.COMMAND_COUNT)
    if (count === DEFAULT_COUNT) {
      console.debug('Update first time, set DefaultCommands.')
      const newCommands = current.map((cmd) => {
        return commands.find((c) => c.id === cmd.id) ?? cmd
      })
      return Storage.setCommands(newCommands)
    }

    // Update commands.
    const newCommands = current.reduce(
      (acc, cmd, i) => {
        const newCmd = commands.find((c) => c.id === cmd.id)
        if (newCmd) {
          acc[`${CMD_PREFIX}${i}`] = newCmd
        }
        return acc
      },
      {} as { [key: string]: Command },
    )
    await chrome.storage.sync.set(newCommands)
    if (chrome.runtime.lastError != null) {
      throw chrome.runtime.lastError
    }
    return true
  },

  /**
   * Remove all commands from chrome sync storages.
   *
   * @returns {Promise<boolean>} true if success's
   * @throws {chrome.runtime.LastError} if error occurred
   */
  removeCommands: async (): Promise<boolean> => {
    const keys = await Storage.commandKeys()
    await chrome.storage.sync.remove(keys)
    if (chrome.runtime.lastError != null) {
      throw chrome.runtime.lastError
    }
    return true
  },

  addCommandListener: (cb: commandChangedCallback) => {
    commandChangedCallbacks.push(cb)
  },

  removeCommandListener: (cb: commandChangedCallback) => {
    const idx = commandChangedCallbacks.findIndex((f) => f === cb)
    if (idx !== -1) commandChangedCallbacks.splice(idx, 1)
  },
}
