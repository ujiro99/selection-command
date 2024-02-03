import UseSetting from './defaultUserSettings.json'

export enum STORAGE_KEY {
  USER = 0,
  BG,
}

const DEFAULTS = {
  [STORAGE_KEY.USER]: UseSetting,
  [STORAGE_KEY.BG]: Object,
}

type onChangedCallback = (newVal: any, oldVal: any) => void

export const Storage = {
  /**
   * Get a item from chrome local storage.
   *
   * @param {STORAGE_KEY} key of item in storage.
   */
  get: <T>(key: STORAGE_KEY): Promise<T> => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get('' + key, function (result) {
        if (chrome.runtime.lastError != null) {
          reject(chrome.runtime.lastError)
        } else {
          const val = result[key] ?? DEFAULTS[key]
          resolve(val)
        }
      })
    })
  },

  /**
   * Set a item to chrome local storage.
   *
   * @param {string} key key of item.
   * @param {any} value item.
   */
  set: (
    key: STORAGE_KEY,
    value: unknown,
  ): Promise<boolean | chrome.runtime.LastError> => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: value }, function () {
        if (chrome.runtime.lastError != null) {
          reject(chrome.runtime.lastError)
        } else {
          resolve(true)
        }
      })
    })
  },

  /**
   * Remove a item in chrome local storage.
   *
   * @param {string} key key of item.
   */
  remove: (key: STORAGE_KEY): Promise<boolean | chrome.runtime.LastError> => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove('' + key, function () {
        if (chrome.runtime.lastError != null) {
          reject(chrome.runtime.lastError)
        } else {
          resolve(true)
        }
      })
    })
  },

  /**
   * Clear all items in chrome local storage.
   */
  clear: (): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.clear(function () {
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
      for (let [k, { oldValue, newValue }] of Object.entries(changes)) {
        if (k === '' + key) cb(newValue, oldValue)
      }
    })
  },
}
