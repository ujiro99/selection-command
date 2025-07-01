import { Command } from '@/types'
import {
  BaseStorage,
  STORAGE_KEY,
  LOCAL_STORAGE_KEY,
  SESSION_STORAGE_KEY,
  CMD_PREFIX,
  ChangedCallback,
  KEY,
} from './storage/index'
import {
  HybridCommandStorage,
  CommandMigrationManager,
  CommandStorage,
} from './storage/commandStorage'
import { DailyBackupManager } from './storage/backupManager'

type commandChangedCallback = (commands: Command[]) => void
const commandChangedCallbacks = [] as commandChangedCallback[]

chrome.storage.onChanged.addListener((changes) => {
  const commands = [] as Command[]
  for (const [k, { newValue }] of Object.entries(changes)) {
    if (k.startsWith(CMD_PREFIX)) commands.push(newValue)
  }
  if (commands.length > 0) {
    commandChangedCallbacks.forEach((cb) => cb(commands))
  }
})

// Re-export everything from sub-modules
export {
  STORAGE_KEY,
  LOCAL_STORAGE_KEY,
  SESSION_STORAGE_KEY,
  CMD_PREFIX,
  CommandMigrationManager,
  DailyBackupManager,
}

export type { ChangedCallback, KEY }

export const Storage = {
  // Base storage methods
  ...BaseStorage,

  // Command-specific methods
  ...CommandStorage,

  addCommandListener: (cb: commandChangedCallback) => {
    commandChangedCallbacks.push(cb)
  },

  removeCommandListener: (cb: commandChangedCallback) => {
    const idx = commandChangedCallbacks.findIndex((f) => f === cb)
    if (idx !== -1) commandChangedCallbacks.splice(idx, 1)
  },

  // New methods for hybrid storage
  hybridStorage: new HybridCommandStorage(),
  
  // Daily backup manager
  dailyBackupManager: new DailyBackupManager(),

  /**
   * New command getter method (hybrid storage compatible)
   */
  getCommands: async (): Promise<Command[]> => {
    return await Storage.hybridStorage.loadCommands()
  },

  /**
   * New command setter method (hybrid storage compatible)
   */
  setCommands: async (commands: Command[]): Promise<boolean> => {
    return await Storage.hybridStorage.saveCommands(commands)
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
    return await CommandStorage.updateCommands(commands, Storage.hybridStorage)
  },
}
