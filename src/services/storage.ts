import DefaultSettings, { DefaultCommands } from './defaultSettings'
import { Command, CaptureDataStorage } from '@/types'

const SYNC_DEBOUNCE_DELAY = 10

let syncSetTimeout: NodeJS.Timeout | null
let syncResolve: (() => void) | null
const syncSetData = new Map<string, any>()

const debouncedSyncSet = (data: Record<string, any>): Promise<void> => {
  return new Promise((resolve) => {
    if (syncSetTimeout != null) {
      clearTimeout(syncSetTimeout)
      syncResolve?.()
      syncResolve = null
    }

    Object.entries(data).forEach(([key, value]) => {
      syncSetData.set(key, value)
    })

    syncSetTimeout = setTimeout(async () => {
      const dataToSet = Object.fromEntries(syncSetData)
      chrome.storage.sync.set(dataToSet, () => {
        if (chrome.runtime.lastError != null) {
          console.error(chrome.runtime.lastError)
        }
        syncSetData.clear()
        syncSetTimeout = null
        resolve()
        syncResolve = null
      })
    }, SYNC_DEBOUNCE_DELAY)
    syncResolve = resolve
  })
}

export enum STORAGE_KEY {
  USER = 0,
  COMMAND_COUNT = 2,
  USER_STATS = 3,
  SHORTCUTS = 4,
}

export enum LOCAL_STORAGE_KEY {
  CACHES = 'caches',
  CLIENT_ID = 'clientId',
  STARS = 'stars',
  CAPTURES = 'captures',
}

export enum SESSION_STORAGE_KEY {
  BG = 'bg',
  SELECTION_TEXT = 'selectionText ',
  SESSION_DATA = 'sessionData',
  MESSAGE_QUEUE = 'messageQueue',
  TMP_CAPTURES = 'tmpCaptures',
  PA_RECORDING = 'pageActionRecording',
  PA_RUNNING = 'pageActionRunning',
  PA_CONTEXT = 'pageActionContext',
  PA_RECORDER_OPTION = 'pageActionRecorderOption',
}

type KEY = STORAGE_KEY | LOCAL_STORAGE_KEY | SESSION_STORAGE_KEY

const CMD_PREFIX = 'cmd-'

const DEFAULT_COUNT = -1

const DEFAULTS = {
  [STORAGE_KEY.USER]: DefaultSettings,
  [STORAGE_KEY.COMMAND_COUNT]: DEFAULT_COUNT,
  [STORAGE_KEY.USER_STATS]: {
    commandExecutionCount: 0,
    hasShownReviewRequest: false,
  },
  [STORAGE_KEY.SHORTCUTS]: {
    shortcuts: [],
  },
  [LOCAL_STORAGE_KEY.CACHES]: {
    images: {},
  },
  [LOCAL_STORAGE_KEY.CLIENT_ID]: '',
  [LOCAL_STORAGE_KEY.STARS]: [],
  [LOCAL_STORAGE_KEY.CAPTURES]: {},
  [SESSION_STORAGE_KEY.BG]: {},
  [SESSION_STORAGE_KEY.SESSION_DATA]: null,
  [SESSION_STORAGE_KEY.MESSAGE_QUEUE]: [],
  [SESSION_STORAGE_KEY.PA_RECORDING]: [],
  [SESSION_STORAGE_KEY.PA_RUNNING]: {},
  [SESSION_STORAGE_KEY.PA_CONTEXT]: {},
  [SESSION_STORAGE_KEY.PA_RECORDER_OPTION]: {},
  [SESSION_STORAGE_KEY.TMP_CAPTURES]: {},
  [SESSION_STORAGE_KEY.SELECTION_TEXT]: '',
}

const detectStorageArea = (key: KEY): chrome.storage.StorageArea => {
  if (Object.values(STORAGE_KEY).includes(key)) {
    return chrome.storage.sync
  }
  if (Object.values(LOCAL_STORAGE_KEY).includes(key as LOCAL_STORAGE_KEY)) {
    return chrome.storage.local
  }
  if (Object.values(SESSION_STORAGE_KEY).includes(key as SESSION_STORAGE_KEY)) {
    return chrome.storage.session
  }
  throw new Error('Invalid Storage Key')
}

const getIndicesToRemove = (fromLen: number, toLen: number): number[] => {
  if (toLen >= fromLen) {
    return []
  }
  const removeCount = fromLen - toLen
  const startIndex = toLen
  const indicesToRemove = []
  for (let i = 0; i < removeCount; i++) {
    indicesToRemove.push(startIndex + i)
  }
  return indicesToRemove
}

export type ChangedCallback<T> = (newVal: T, oldVal: T) => void
const changedCallbacks = {} as { [key: string]: ChangedCallback<any>[] }

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

type UpdateFunc<T> = (currentVal: T) => T

export const Storage = {
  /**
   * Get a item from chrome sync storage.
   *
   * @param {STORAGE_KEY} key of item in storage.
   */
  get: async <T>(key: KEY): Promise<T> => {
    const area = detectStorageArea(key)
    let result = await area.get(`${key}`)
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
  set: async <T>(key: KEY, value: T): Promise<boolean> => {
    const area = detectStorageArea(key)

    if (area === chrome.storage.sync) {
      await debouncedSyncSet({ [key.toString()]: value })
      return true
    } else {
      await area.set({ [key]: value })
      return true
    }
  },

  /**
   * Set a item to chrome sync storage.
   *
   * @param {string} key key of item.
   * @param {UpdateFunc} updater function to update item.
   *
   * @returns {Promise<boolean>} true if success's
   */
  update: async <T>(key: KEY, updater: UpdateFunc<T>): Promise<boolean> => {
    const data = await Storage.get<T>(key)
    const newData = updater(data)
    return await Storage.set(key, newData)
  },

  /**
   * Remove a item in chrome sync storage.
   *
   * @param {string} key key of item.
   */
  remove: (key: KEY): Promise<boolean | chrome.runtime.LastError> => {
    return new Promise((resolve, reject) => {
      const area = detectStorageArea(key)
      area.remove(`${key}`, () => {
        if (chrome.runtime.lastError != null) {
          reject(chrome.runtime.lastError)
        } else {
          resolve(true)
        }
      })
    })
  },

  addListener: <T>(key: KEY, cb: ChangedCallback<T>) => {
    changedCallbacks[key] = changedCallbacks[key] ?? []
    changedCallbacks[key].push(cb)
  },

  removeListener: (key: KEY, cb: ChangedCallback<any>) => {
    changedCallbacks[key] = changedCallbacks[key]?.filter((f) => f !== cb)
  },

  commandKeys: async (): Promise<string[]> => {
    const count = await Storage.get<number>(STORAGE_KEY.COMMAND_COUNT)
    return Array.from({ length: count }, (_, i) => `${CMD_PREFIX}${i}`)
  },

  getCapture: async (key: string): Promise<string | undefined> => {
    let captures = await Storage.get<CaptureDataStorage>(
      LOCAL_STORAGE_KEY.CAPTURES,
    )
    let c = captures[key]
    if (c != null) {
      return c
    }
    captures = await Storage.get<CaptureDataStorage>(
      SESSION_STORAGE_KEY.TMP_CAPTURES,
    )
    c = captures[key]
    if (c != null) {
      return c
    }
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
    const count = commands.length
    const preCount = await Storage.get<number>(STORAGE_KEY.COMMAND_COUNT)

    // Update commands and count.
    const data = commands.reduce(
      (acc, cmd, i) => {
        acc[`${CMD_PREFIX}${i}`] = cmd
        return acc
      },
      {} as { [key: string]: Command },
    )
    await debouncedSyncSet({
      ...data,
      [STORAGE_KEY.COMMAND_COUNT]: commands.length,
    })

    // Remove surplus commands
    if (preCount > count) {
      const removeKeys = getIndicesToRemove(preCount, count).map(
        (i) => `${CMD_PREFIX}${i}`,
      )
      await chrome.storage.sync.remove(removeKeys)
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
    await debouncedSyncSet(newCommands)
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
