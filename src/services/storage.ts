import { Command } from "@/types"
import {
  BaseStorage,
  STORAGE_KEY,
  LOCAL_STORAGE_KEY,
  SESSION_STORAGE_KEY,
  CMD_PREFIX,
  ChangedCallback,
  KEY,
} from "./storage/index"
import {
  CommandStorage,
  CommandMigrationManager,
  commandChangedCallback,
} from "./storage/commandStorage"
import {
  DailyBackupManager,
  WeeklyBackupManager,
  LegacyBackupManager,
} from "./storage/backupManager"

// Re-export everything from sub-modules
export {
  STORAGE_KEY,
  LOCAL_STORAGE_KEY,
  SESSION_STORAGE_KEY,
  CMD_PREFIX,
  CommandMigrationManager,
  DailyBackupManager,
  WeeklyBackupManager,
  LegacyBackupManager,
}

export type { ChangedCallback, KEY }

export const Storage = {
  // Base storage methods
  ...BaseStorage,

  // New methods for command storage (will be initialized after Storage is defined)
  commandStorage: null as unknown as CommandStorage,

  // Daily backup manager
  dailyBackupManager: new DailyBackupManager(),

  // Weekly backup manager
  weeklyBackupManager: new WeeklyBackupManager(),

  /**
   * New command getter method (command storage compatible)
   */
  getCommands: async (): Promise<Command[]> => {
    return await Storage.commandStorage.loadCommands()
  },

  /**
   * New command setter method (command storage compatible)
   */
  setCommands: async (commands: Command[]): Promise<boolean> => {
    return await Storage.commandStorage.saveCommands(commands)
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
    return await Storage.commandStorage.updateCommands(commands)
  },

  /**
   * Add a command changed listener.
   * @param {commandChangedCallback} cb - The callback to be called when commands change.
   */
  addCommandListener: (cb: commandChangedCallback) => {
    return Storage.commandStorage.addCommandListener(cb)
  },

  /**
   * Remove a command changed listener.
   * @param {commandChangedCallback} cb - The callback to be removed.
   */
  removeCommandListener: (cb: commandChangedCallback) => {
    return Storage.commandStorage.removeCommandListener(cb)
  },
}

// Initialize command storage after Storage object is defined
Storage.commandStorage = new CommandStorage(Storage)
