import UseSetting from './defaultUserSettings.json'

export enum STORAGE_KEY {
  USER = 0,
  BG = 1,
  COMMANDS = 2,
  COMMAND_COUNT = 3,
}

export enum LOCAL_STORAGE_KEY {
  CACHES = 'caches',
}

const DEFAULTS = {
  [STORAGE_KEY.USER]: UseSetting,
  [STORAGE_KEY.BG]: {},
  [STORAGE_KEY.COMMANDS]: [],
  [STORAGE_KEY.COMMAND_COUNT]: 0,
  [LOCAL_STORAGE_KEY.CACHES]: {
    images: {},
  },
}

export enum STORAGE_AREA {
  SYNC = 'sync',
  LOCAL = 'local',
}

export type onChangedCallback = (newVal: unknown, oldVal: unknown) => void

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
    } else {
      return result[key] ?? structuredClone(DEFAULTS[key])
    }
  },

  /**
   * Set a item to chrome sync storage.
   *
   * @param {string} key key of item.
   * @param {any} value item.
   */
  set: (
    key: STORAGE_KEY | LOCAL_STORAGE_KEY,
    value: unknown,
    area = STORAGE_AREA.SYNC,
  ): Promise<boolean | chrome.runtime.LastError> => {
    return new Promise((resolve, reject) => {
      chrome.storage[area].set({ [key]: value }, () => {
        if (chrome.runtime.lastError != null) {
          reject(chrome.runtime.lastError)
        } else {
          resolve(true)
        }
      })
    })
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

  addListener: (key: STORAGE_KEY, cb: onChangedCallback) => {
    chrome.storage.onChanged.addListener((changes) => {
      for (const [k, { oldValue, newValue }] of Object.entries(changes)) {
        if (k === `${key}`) cb(newValue, oldValue)
      }
    })
  },
}
