import { DefaultCommands } from '../option/defaultSettings'
import { Command } from '@/types'
import {
  BaseStorage,
  STORAGE_KEY,
  LOCAL_STORAGE_KEY,
  CMD_PREFIX,
  debouncedSyncSet,
} from './index'
import { VERSION } from '@/const'

// Command change callbacks
export type commandChangedCallback = (commands: Command[]) => void
const commandChangedCallbacks = [] as commandChangedCallback[]

// Setup command change listener
chrome.storage.onChanged.addListener((changes) => {
  const commands = [] as Command[]
  for (const [k, { newValue }] of Object.entries(changes)) {
    if (k.startsWith(CMD_PREFIX)) commands.push(newValue)
  }
  if (commands.length > 0) {
    commandChangedCallbacks.forEach((cb) => cb(commands))
  }
})

const DEFAULT_COUNT = -1

/**
 * Generate checksum from object (JSON.stringify based)
 * Uses a simple hash algorithm compatible with browser environment
 * @param obj - Object to generate checksum for
 * @returns Checksum (hexadecimal string)
 */
function generateChecksum(obj: unknown): string {
  const normalized = JSON.stringify(obj, Object.keys(obj || {}).sort())

  // Simple hash algorithm (djb2) that works in browser
  let hash = 5381
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash << 5) + hash + normalized.charCodeAt(i)
    hash = hash & hash // Convert to 32bit integer
  }

  // Convert to hex string and pad to ensure consistent length
  return Math.abs(hash).toString(16).padStart(8, '0')
}

async function loadLegacyCommandData(options?: {
  returnDefaultOnEmpty?: boolean
  throwOnError?: boolean
}): Promise<Command[]> {
  const { returnDefaultOnEmpty = false, throwOnError = false } = options || {}

  try {
    const count = await BaseStorage.get<number>(STORAGE_KEY.COMMAND_COUNT)
    if (count === DEFAULT_COUNT) {
      return returnDefaultOnEmpty ? DefaultCommands : []
    }

    const keys = Array.from({ length: count }, (_, i) => `${CMD_PREFIX}${i}`)
    const result = await chrome.storage.sync.get(keys)

    if (throwOnError && chrome.runtime.lastError != null) {
      throw chrome.runtime.lastError
    }

    return keys.map((key) => result[key]).filter((cmd) => cmd != null)
  } catch (error) {
    if (throwOnError) {
      throw error
    }
    console.warn('Failed to load legacy commands:', error)
    return returnDefaultOnEmpty ? DefaultCommands : []
  }
}

// Type definitions for hybrid storage
interface CommandMetadata {
  order: string[] // Command ID order array
  syncCount: number // Number of commands saved in sync storage
  localCount: number // Number of commands saved in local storage
  version: number // Data version (timestamp)
  checksum: string // Hash for integrity checking
}

interface StorageAllocation {
  sync: {
    commands: Command[]
    totalBytes: number
    itemCount: number
  }
  local: {
    commands: Command[]
    totalBytes: number
    itemCount: number
  }
  metadata: CommandMetadata
}

// Storage capacity calculation class
class StorageCapacityCalculator {
  private readonly SYNC_COMMAND_TOTAL = 60 * 1024 // 60KB (including safety margin)
  private readonly ITEM_MAX_SIZE = 8 * 1024 // 8KB

  /**
   * Calculate accurate byte count with UTF-8 encoding
   */
  calculateCommandSize(command: Command): number {
    // Serialize command object to JSON
    const jsonStr = JSON.stringify(command)

    // Calculate byte count with UTF-8 encoding
    const bytes = new TextEncoder().encode(jsonStr).length

    // Add overhead for chrome.storage key name
    const keyOverhead = new TextEncoder().encode(
      `${CMD_PREFIX}${command.id}`,
    ).length

    return bytes + keyOverhead
  }

  /**
   * Analyze storage capacity for all commands and decide allocation
   */
  analyzeAndAllocate(commands: Command[]): StorageAllocation {
    // Step 1: Calculate size for each command
    const commandSizes = commands.map((command) => ({
      command,
      size: this.calculateCommandSize(command),
      canFitInSync: this.calculateCommandSize(command) <= this.ITEM_MAX_SIZE,
    }))

    // Step 2: Allocate large commands to local storage first
    const largeCommands = commandSizes.filter((item) => !item.canFitInSync)
    const candidateCommands = commandSizes.filter((item) => item.canFitInSync)

    // Step 3: Sequentially allocate until sync capacity is reached
    const syncCommands: Array<{ command: Command; size: number }> = []
    const localCommands: Array<{ command: Command; size: number }> = [
      ...largeCommands,
    ]

    let syncUsage = 0
    for (const item of candidateCommands) {
      if (syncUsage + item.size <= this.SYNC_COMMAND_TOTAL) {
        syncCommands.push(item)
        syncUsage += item.size
      } else {
        localCommands.push(item)
      }
    }

    // Step 4: Build allocation result
    return {
      sync: {
        commands: syncCommands.map((item) => item.command),
        totalBytes: syncUsage,
        itemCount: syncCommands.length,
      },
      local: {
        commands: localCommands.map((item) => item.command),
        totalBytes: localCommands.reduce((sum, item) => sum + item.size, 0),
        itemCount: localCommands.length,
      },
      metadata: this.createMetadata(
        commands,
        syncCommands.length,
        localCommands.length,
      ),
    }
  }

  private createMetadata(
    allCommands: Command[],
    syncCount: number,
    localCount: number,
  ): CommandMetadata {
    return {
      order: allCommands.map((cmd) => cmd.id),
      syncCount,
      localCount,
      version: Date.now(),
      checksum: generateChecksum(allCommands),
    }
  }
}

// Metadata management class
class MetadataManager {
  private readonly METADATA_KEY = STORAGE_KEY.COMMAND_METADATA
  private readonly LOCAL_COUNT_KEY = LOCAL_STORAGE_KEY.COMMAND_LOCAL_COUNT

  async saveMetadata(metadata: CommandMetadata): Promise<void> {
    // Save metadata body to sync storage
    await BaseStorage.set(this.METADATA_KEY, metadata)

    // Also save local count to local storage (redundancy)
    await BaseStorage.set(this.LOCAL_COUNT_KEY, metadata.localCount)
  }

  async loadMetadata(): Promise<CommandMetadata | null> {
    try {
      const metadata = await BaseStorage.get<CommandMetadata>(this.METADATA_KEY)
      return metadata || null
    } catch (error) {
      console.error('Failed to load metadata:', error)
      return null
    }
  }

  async validateMetadata(commands: Command[]): Promise<boolean> {
    const metadata = await this.loadMetadata()
    if (!metadata) return false

    // Basic integrity check
    const totalCount = metadata.syncCount + metadata.localCount
    if (totalCount !== commands.length) return false

    // Checksum-based integrity check
    const currentChecksum = generateChecksum(commands)
    return metadata.checksum === currentChecksum
  }

  // Migration determination
  async needsMigration(): Promise<boolean> {
    const metadata = await this.loadMetadata()
    const oldCount = await BaseStorage.get<number>(STORAGE_KEY.COMMAND_COUNT)

    // When metadata doesn't exist but legacy format data exists
    return !metadata && oldCount !== DEFAULT_COUNT
  }
}

// Migration management class
export class CommandMigrationManager {
  private readonly MIGRATION_VERSION = VERSION
  private readonly MIGRATION_FLAG_KEY = LOCAL_STORAGE_KEY.MIGRATION_STATUS

  async performMigration(): Promise<Command[]> {
    try {
      console.debug('Starting command migration to hybrid storage...')

      // Step 1: Load legacy format data
      const legacyCommands = await loadLegacyCommandData()
      if (legacyCommands.length === 0) {
        return DefaultCommands
      }

      // Step 2: Backup data
      await this.backupCommands(legacyCommands)

      // Step 3: Save in new format
      const hybridStorage = new HybridCommandStorage()
      await hybridStorage.saveCommands(legacyCommands)

      // Step 4: Set migration completion flag
      await BaseStorage.set(this.MIGRATION_FLAG_KEY, {
        version: this.MIGRATION_VERSION,
        migratedAt: Date.now(),
        commandCount: legacyCommands.length,
      })

      console.debug(
        `Migration completed: ${legacyCommands.length} commands migrated`,
      )
      return legacyCommands
    } catch (error) {
      console.error('Migration failed:', error)

      // Attempt to restore from backup when migration fails
      const backups = await this.restoreFromBackup()
      if (backups.length > 0) {
        console.debug(
          `Migration failed, but restored ${backups.length} commands from backup`,
        )
        return backups
      }

      throw new Error(
        `Command migration failed: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  async needsMigration(): Promise<boolean> {
    try {
      const migrationStatus = (await BaseStorage.get(
        this.MIGRATION_FLAG_KEY,
      )) as {
        version?: string
      } | null
      if (
        migrationStatus &&
        migrationStatus.version === this.MIGRATION_VERSION
      ) {
        return false
      }
    } catch {
      // Migration flag doesn't exist = migration not performed
    }

    const legacyCount = await BaseStorage.get<number>(STORAGE_KEY.COMMAND_COUNT)
    return legacyCount !== DEFAULT_COUNT
  }

  private async backupCommands(commands: Command[]): Promise<void> {
    const backup = {
      version: 'legacy',
      timestamp: Date.now(),
      commands: commands,
    }
    await chrome.storage.local.set({
      [LOCAL_STORAGE_KEY.COMMANDS_BACKUP]: backup,
    })
  }

  /**
   * Restore from legacy data backup
   * Used for recovery from migration failure or data corruption
   */
  async restoreFromBackup(): Promise<Command[]> {
    try {
      const result = await chrome.storage.local.get(
        LOCAL_STORAGE_KEY.COMMANDS_BACKUP,
      )
      const backup = result[LOCAL_STORAGE_KEY.COMMANDS_BACKUP]

      if (backup && backup.commands && Array.isArray(backup.commands)) {
        console.info(
          `Restoring ${backup.commands.length} commands from backup (created at ${new Date(backup.timestamp).toLocaleString()})`,
        )
        return backup.commands
      }
      return []
    } catch (error) {
      console.error('Failed to restore from backup:', error)
      return []
    }
  }
}

// Hybrid command storage class
export class HybridCommandStorage {
  public calculator = new StorageCapacityCalculator()
  private metadataManager = new MetadataManager()

  async saveCommands(commands: Command[]): Promise<boolean> {
    try {
      // Step 1: Determine storage allocation
      const allocation = this.calculator.analyzeAndAllocate(commands)

      // Step 2: Save commands and metadata atomically
      await this.saveCommandsAndMetadataAtomically(allocation)
      return true
    } catch (error) {
      console.error('Failed to save commands:', error)
      throw error
    }
  }

  async loadCommands(retryCount = 0): Promise<Command[]> {
    const MAX_RETRIES = 3
    const RETRY_DELAY_MS = 10

    try {
      // Step 1: Check if migration is needed
      if (await this.metadataManager.needsMigration()) {
        const migrationManager = new CommandMigrationManager()
        return await migrationManager.performMigration()
      }

      // Step 2: Load metadata
      const metadata = await this.metadataManager.loadMetadata()
      if (!metadata) {
        return DefaultCommands
      }

      // Step 3: Load commands from both storage areas
      const [syncCommands, localCommands] = await Promise.all([
        this.loadFromSync(metadata.syncCount),
        this.loadFromLocal(metadata.localCount),
      ])

      // Step 4: Merge in metadata order
      const allCommands = [...syncCommands, ...localCommands]
      const orderedCommands = this.reorderCommands(allCommands, metadata.order)

      // Step 5: Integrity check
      if (!(await this.metadataManager.validateMetadata(orderedCommands))) {
        console.debug(
          `Command integrity check failed (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`,
        )
        // Retry with delay if we haven't exceeded max retries
        if (retryCount < MAX_RETRIES) {
          console.info(
            `Retrying command load after ${RETRY_DELAY_MS}ms delay...`,
          )
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
          return await this.loadCommands(retryCount + 1)
        }
        console.warn('Command integrity check failed after all retries...')
      }

      return orderedCommands
    } catch (error) {
      console.error('Failed to load commands:', error)
      return DefaultCommands
    }
  }

  private async saveCommandsAndMetadataAtomically(
    allocation: StorageAllocation,
  ): Promise<void> {
    const syncSavePromises: Promise<void>[] = []

    // Save to sync storage
    allocation.sync.commands.forEach((command, index) => {
      const key = `${CMD_PREFIX}${index}`
      syncSavePromises.push(debouncedSyncSet({ [key]: command }))
    })

    // Save to local storage
    const localSetData = new Map<string, unknown>()
    allocation.local.commands.forEach((command, index) => {
      const key = `${CMD_PREFIX}local-${index}`
      localSetData.set(key, command)
    })

    const dataToSet = Object.fromEntries(localSetData)
    const localSavePromise = chrome.storage.local.set(dataToSet)

    // Add metadata save to the same promise batch
    const metadataSavePromise = this.metadataManager.saveMetadata(
      allocation.metadata,
    )

    // Save commands and metadata atomically in parallel
    await Promise.all([
      await Promise.all(syncSavePromises),
      localSavePromise,
      metadataSavePromise,
    ])
  }

  private async loadFromSync(count: number): Promise<Command[]> {
    if (count === 0) return []

    const keys = Array.from({ length: count }, (_, i) => `${CMD_PREFIX}${i}`)
    const result = await chrome.storage.sync.get(keys)

    return keys.map((key) => result[key]).filter((cmd) => cmd != null)
  }

  private async loadFromLocal(count: number): Promise<Command[]> {
    if (count === 0) return []

    const keys = Array.from(
      { length: count },
      (_, i) => `${CMD_PREFIX}local-${i}`,
    )
    const result = await chrome.storage.local.get(keys)

    return keys.map((key) => result[key]).filter((cmd) => cmd != null)
  }

  private reorderCommands(commands: Command[], order: string[]): Command[] {
    const commandMap = new Map(commands.map((cmd) => [cmd.id, cmd]))
    return order
      .map((id) => commandMap.get(id))
      .filter((cmd): cmd is Command => cmd != null)
  }
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

export const CommandStorage = {
  /**
   * Get all commands from chrome sync storage (legacy format).
   *
   * @returns {Promise<Command[]>} commands
   * @throws {chrome.runtime.LastError} if error occurred
   */
  getCommandsOld: async (): Promise<Command[]> => {
    return await loadLegacyCommandData({
      returnDefaultOnEmpty: true,
      throwOnError: true,
    })
  },

  /**
   * Set all commands to chrome sync storage.
   *
   * @returns {Promise<boolean>} true if success's
   * @throws {chrome.runtime.LastError} if error occurred
   */
  setCommandsOld: async (
    commands: Command[],
  ): Promise<boolean | chrome.runtime.LastError> => {
    const count = commands.length
    const preCount = await BaseStorage.get<number>(STORAGE_KEY.COMMAND_COUNT)

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
    hybridStorage: HybridCommandStorage,
  ): Promise<boolean | chrome.runtime.LastError> => {
    const current = await hybridStorage.loadCommands()

    // If update first time, set DefaultCommands.
    const count = await BaseStorage.get<number>(STORAGE_KEY.COMMAND_COUNT)
    if (count === DEFAULT_COUNT) {
      console.debug('Update first time, set DefaultCommands.')
      const newCommands = current.map((cmd) => {
        return commands.find((c) => c.id === cmd.id) ?? cmd
      })
      return hybridStorage.saveCommands(newCommands)
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
