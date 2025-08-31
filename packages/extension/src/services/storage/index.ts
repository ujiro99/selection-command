import DefaultSettings from "../option/defaultSettings"
import {
  KEY,
  CMD_KEY,
  CMD_LOCAL_KEY,
  STORAGE_KEY,
  LOCAL_STORAGE_KEY,
  SESSION_STORAGE_KEY,
  CMD_PREFIX,
} from "./const"

const SYNC_DEBOUNCE_DELAY = 10

let syncSetTimeout: NodeJS.Timeout | null
let syncSetResolves: (() => void)[] = []
const syncSetData = new Map<string, unknown>()

export const cmdSyncKey = (idx: number): CMD_KEY => `${CMD_PREFIX}${idx}`

export const cmdLocalKey = (idx: number): CMD_LOCAL_KEY =>
  `${CMD_PREFIX}local-${idx}`

export const debouncedSyncSet = (
  data: Record<string, unknown>,
): Promise<void> => {
  return new Promise((resolve) => {
    if (syncSetTimeout != null) {
      clearTimeout(syncSetTimeout)
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
        syncSetResolves.forEach((res) => res())
        syncSetResolves = []
      })
    }, SYNC_DEBOUNCE_DELAY)
    syncSetResolves.push(resolve)
  })
}

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
  [STORAGE_KEY.SYNC_COMMAND_METADATA]: null,
  [LOCAL_STORAGE_KEY.CACHES]: {
    images: {},
  },
  [LOCAL_STORAGE_KEY.CLIENT_ID]: "",
  [LOCAL_STORAGE_KEY.STARS]: [],
  [LOCAL_STORAGE_KEY.MIGRATION_STATUS]: null,
  [LOCAL_STORAGE_KEY.COMMANDS_BACKUP]: null,
  [LOCAL_STORAGE_KEY.DAILY_COMMANDS_BACKUP]: null,
  [LOCAL_STORAGE_KEY.WEEKLY_COMMANDS_BACKUP]: null,
  [LOCAL_STORAGE_KEY.LOCAL_COMMAND_METADATA]: null,
  [LOCAL_STORAGE_KEY.GLOBAL_COMMAND_METADATA]: null,
  [SESSION_STORAGE_KEY.BG]: {},
  [SESSION_STORAGE_KEY.SESSION_DATA]: null,
  [SESSION_STORAGE_KEY.MESSAGE_QUEUE]: [],
  [SESSION_STORAGE_KEY.PA_RECORDING]: [],
  [SESSION_STORAGE_KEY.PA_RUNNING]: {},
  [SESSION_STORAGE_KEY.PA_CONTEXT]: {},
  [SESSION_STORAGE_KEY.PA_RECORDER_OPTION]: {},
  [SESSION_STORAGE_KEY.TMP_CAPTURES]: {},
  [SESSION_STORAGE_KEY.SELECTION_TEXT]: "",
} as const

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

  // Handle dynamic command keys
  if (typeof key === "string") {
    if (key.startsWith(CMD_PREFIX)) {
      // Command keys: cmd-0, cmd-1, cmd-local-0, cmd-local-1, etc.
      return key.includes("local-") ? chrome.storage.local : chrome.storage.sync
    }
  }

  throw new Error("Invalid Storage Key")
}

export type ChangedCallback<T> = (newVal: T, oldVal: T) => void
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const changedCallbacks = {} as { [key: string]: ChangedCallback<any>[] }

chrome.storage.onChanged.addListener((changes) => {
  for (const [k, { oldValue, newValue }] of Object.entries(changes)) {
    for (const [kk, callbacks] of Object.entries(changedCallbacks)) {
      if (k === kk) callbacks.forEach((cb) => cb(newValue, oldValue))
    }
  }
})

type UpdateFunc<T> = (currentVal: T) => T

export const BaseStorage = {
  get: async <T>(key: KEY): Promise<T> => {
    const area = detectStorageArea(key)
    const result = await area.get(`${key}`)
    if (chrome.runtime.lastError != null) {
      throw chrome.runtime.lastError
    }
    // For dynamic keys (like command keys), return the raw value or undefined
    // For static keys, use the default value from DEFAULTS
    const hasDefault = key in DEFAULTS
    return (
      result[key] ??
      (hasDefault
        ? structuredClone(DEFAULTS[key as keyof typeof DEFAULTS])
        : undefined)
    )
  },

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

  update: async <T>(key: KEY, updater: UpdateFunc<T>): Promise<boolean> => {
    const data = await BaseStorage.get<T>(key)
    const newData = updater(data)
    return await BaseStorage.set(key, newData)
  },

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

    return () => {
      BaseStorage.removeListener(key, cb)
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removeListener: (key: KEY, cb: ChangedCallback<any>) => {
    changedCallbacks[key] = changedCallbacks[key]?.filter((f) => f !== cb)
  },
}
