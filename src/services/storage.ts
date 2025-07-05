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
  HybridCommandStorage,
  CommandMigrationManager,
  CommandStorage,
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

export type { ChangedCallback, KEY, commandChangedCallback }

export const Storage = {
  // Base storage methods
  ...BaseStorage,

  // Command-specific methods
  ...CommandStorage,

  // New methods for hybrid storage (will be initialized after Storage is defined)
  hybridStorage: null as unknown as HybridCommandStorage,

  // Daily backup manager
  dailyBackupManager: new DailyBackupManager(),

  // Weekly backup manager
  weeklyBackupManager: new WeeklyBackupManager(),

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
    return await CommandStorage.updateCommands(
      commands,
      Storage.hybridStorage,
      Storage,
    )
  },
}

// Initialize hybrid storage after Storage object is defined
Storage.hybridStorage = new HybridCommandStorage(Storage)
