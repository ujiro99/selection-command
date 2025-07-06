import { DefaultCommands } from "../option/defaultSettings"
import { Command } from "@/types"
import {
  BaseStorage,
  STORAGE_KEY,
  LOCAL_STORAGE_KEY,
  CMD_PREFIX,
  KEY,
  debouncedSyncSet,
} from "./index"
import { VERSION } from "@/const"
import { LegacyBackupManager } from "./backupManager"

// Storage interface for dependency injection
interface StorageInterface {
  get<T>(key: KEY): Promise<T>
  set<T>(key: KEY, value: T): Promise<boolean>
}

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
  return Math.abs(hash).toString(16).padStart(8, "0")
}

async function loadLegacyCommandData(
  storage: StorageInterface,
  options?: {
    returnDefaultOnEmpty?: boolean
    throwOnError?: boolean
  },
): Promise<Command[]> {
  const { returnDefaultOnEmpty = false, throwOnError = false } = options || {}

  try {
    const count = await storage.get<number>(STORAGE_KEY.COMMAND_COUNT)
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
    console.warn("Failed to load legacy commands:", error)
    return returnDefaultOnEmpty ? DefaultCommands : []
  }
}

// Type definitions for hybrid storage
interface CommandMetadata {
  count: number // Number of commands saved in this storage
  version: number // Data version (timestamp)
  checksum: string // Hash for integrity checking
}

interface GlobalCommandMetadata {
  globalOrder: string[] // Global command order array
  version: number // Global data version (timestamp)
  lastUpdated: number // Last update timestamp
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
  syncMetadata: CommandMetadata
  localMetadata: CommandMetadata
  globalMetadata: GlobalCommandMetadata
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
      ...this.createMetadata(
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
  ): {
    syncMetadata: CommandMetadata
    localMetadata: CommandMetadata
    globalMetadata: GlobalCommandMetadata
  } {
    const syncCommands = allCommands.slice(0, syncCount)
    const localCommands = allCommands.slice(syncCount)
    const timestamp = Date.now()

    return {
      syncMetadata: {
        count: syncCount,
        version: timestamp,
        checksum: generateChecksum(syncCommands),
      },
      localMetadata: {
        count: localCount,
        version: timestamp,
        checksum: generateChecksum(localCommands),
      },
      globalMetadata: {
        globalOrder: allCommands.map((cmd) => cmd.id),
        version: timestamp,
        lastUpdated: timestamp,
      },
    }
  }
}

// Command metadata management class
class CommandMetadataManager {
  private readonly SYNC_METADATA_KEY = STORAGE_KEY.SYNC_COMMAND_METADATA
  private readonly LOCAL_METADATA_KEY = LOCAL_STORAGE_KEY.LOCAL_COMMAND_METADATA
  private readonly GLOBAL_METADATA_KEY =
    LOCAL_STORAGE_KEY.GLOBAL_COMMAND_METADATA
  private storage: StorageInterface

  constructor(storage: StorageInterface = BaseStorage) {
    this.storage = storage
  }

  async saveSyncCommandMetadata(metadata: CommandMetadata): Promise<void> {
    await this.storage.set(this.SYNC_METADATA_KEY, metadata)
  }

  async saveLocalCommandMetadata(metadata: CommandMetadata): Promise<void> {
    await this.storage.set(this.LOCAL_METADATA_KEY, metadata)
  }

  async saveGlobalCommandMetadata(
    metadata: GlobalCommandMetadata,
  ): Promise<void> {
    console.debug("Saving global command metadata:", metadata)
    await this.storage.set(this.GLOBAL_METADATA_KEY, metadata)
  }

  async loadSyncCommandMetadata(): Promise<CommandMetadata | null> {
    try {
      const metadata = await this.storage.get<CommandMetadata>(
        this.SYNC_METADATA_KEY,
      )
      return metadata || null
    } catch (error) {
      console.error("Failed to load sync metadata:", error)
      return null
    }
  }

  async loadLocalCommandMetadata(): Promise<CommandMetadata | null> {
    try {
      const metadata = await this.storage.get<CommandMetadata>(
        this.LOCAL_METADATA_KEY,
      )
      return metadata || null
    } catch (error) {
      console.error("Failed to load local metadata:", error)
      return null
    }
  }

  async loadGlobalCommandMetadata(): Promise<GlobalCommandMetadata | null> {
    try {
      const metadata = await this.storage.get<GlobalCommandMetadata>(
        this.GLOBAL_METADATA_KEY,
      )
      if (metadata) {
        return metadata
      }
      console.warn("Global command metadata not found.")
      return null
    } catch (error) {
      console.error("Failed to load global metadata:", error)
      return null
    }
  }

  async validateCommandIntegrity(
    commands: Command[],
    metadata: CommandMetadata,
  ): Promise<boolean> {
    if (!metadata) return false

    // Basic integrity check
    if (metadata.count !== commands.length) return false

    // Checksum-based integrity check
    const currentChecksum = generateChecksum(commands)
    return metadata.checksum === currentChecksum
  }

  async validateGlobalConsistency(allCommands: Command[]): Promise<boolean> {
    const globalMetadata = await this.loadGlobalCommandMetadata()
    if (!globalMetadata) return false

    // Check if global order matches actual commands
    const actualIds = allCommands.map((cmd) => cmd.id)
    const expectedIds = globalMetadata.globalOrder

    return (
      actualIds.length === expectedIds.length &&
      actualIds.every((id, index) => id === expectedIds[index])
    )
  }

  // Migration determination
  async needsMigration(): Promise<boolean> {
    const syncMetadata = await this.loadSyncCommandMetadata()
    const localMetadata = await this.loadLocalCommandMetadata()
    const globalMetadata = await this.loadGlobalCommandMetadata()
    const oldCount = await this.storage.get<number>(STORAGE_KEY.COMMAND_COUNT)

    // When new metadata doesn't exist but legacy format data exists
    return (
      !syncMetadata &&
      !localMetadata &&
      !globalMetadata &&
      oldCount !== DEFAULT_COUNT
    )
  }
}

// Migration management class
export class CommandMigrationManager {
  private readonly MIGRATION_VERSION = VERSION
  private readonly MIGRATION_FLAG_KEY = LOCAL_STORAGE_KEY.MIGRATION_STATUS
  private storage: StorageInterface

  constructor(storage: StorageInterface = BaseStorage) {
    this.storage = storage
  }

  async performMigration(): Promise<Command[]> {
    try {
      console.debug("Starting command migration to hybrid storage...")

      // Step 1: Load legacy format data
      const legacyCommands = await loadLegacyCommandData(this.storage)
      if (legacyCommands.length === 0) {
        return DefaultCommands
      }

      // Step 2: Backup data
      const legacyBackupManager = new LegacyBackupManager()
      await legacyBackupManager.backupCommandsForMigration(legacyCommands)

      // Step 3: Save in new format
      const hybridStorage = new HybridCommandStorage(this.storage)
      await hybridStorage.saveCommands(legacyCommands)

      // Step 4: Set migration completion flag
      await this.storage.set(this.MIGRATION_FLAG_KEY, {
        version: this.MIGRATION_VERSION,
        migratedAt: Date.now(),
        commandCount: legacyCommands.length,
      })

      console.debug(
        `Migration completed: ${legacyCommands.length} commands migrated`,
      )
      return legacyCommands
    } catch (error) {
      console.error("Migration failed:", error)

      // Attempt to restore from backup when migration fails
      const legacyBackupManager = new LegacyBackupManager()
      const backupData = await legacyBackupManager.restoreFromLegacyBackup()
      if (backupData.commands.length > 0) {
        console.debug(
          `Migration failed, but restored ${backupData.commands.length} commands from backup`,
        )
        return backupData.commands
      }

      throw new Error(
        `Command migration failed: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  async needsMigration(): Promise<boolean> {
    try {
      const migrationStatus = (await this.storage.get(
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

    const legacyCount = await this.storage.get<number>(
      STORAGE_KEY.COMMAND_COUNT,
    )
    return legacyCount !== DEFAULT_COUNT
  }

  /**
   * Restore both commands and folders from legacy backup
   */
  async restoreFromBackup(): Promise<{
    commands: Command[]
    folders: import("@/types").CommandFolder[]
  }> {
    const legacyBackupManager = new LegacyBackupManager()
    return await legacyBackupManager.restoreFromLegacyBackup()
  }
}

// Hybrid command storage class
export class HybridCommandStorage {
  public calculator = new StorageCapacityCalculator()
  private metadataManager: CommandMetadataManager
  private storage: StorageInterface

  constructor(storage: StorageInterface = BaseStorage) {
    this.storage = storage
    this.metadataManager = new CommandMetadataManager(this.storage)
  }

  async saveCommands(commands: Command[]): Promise<boolean> {
    try {
      // Step 1: Determine storage allocation
      const allocation = this.calculator.analyzeAndAllocate(commands)

      // Step 2: Save commands and metadata atomically
      await this.saveCommandsAndMetadata(allocation)
      return true
    } catch (error) {
      console.error("Failed to save commands:", error)
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
      const [syncMetadata, localMetadata, globalMetadata] = await Promise.all([
        this.metadataManager.loadSyncCommandMetadata(),
        this.metadataManager.loadLocalCommandMetadata(),
        this.metadataManager.loadGlobalCommandMetadata(),
      ])

      if (!syncMetadata && !localMetadata && !globalMetadata) {
        return DefaultCommands
      }

      // Step 3: Load commands from both storage areas
      const [syncCommands, localCommands] = await Promise.all([
        this.loadFromSync(syncMetadata?.count || 0),
        this.loadFromLocal(localMetadata?.count || 0),
      ])

      // Step 4: Merge and order commands with fallback
      const allCommands = [...syncCommands, ...localCommands]
      let orderedCommands: Command[]

      if (globalMetadata) {
        // Reorder commands according to global order, ignoring non-existent commands
        orderedCommands = this.reorderCommands(
          allCommands,
          globalMetadata.globalOrder,
        )

        // Check if there are missing commands
        const expectedCount = globalMetadata.globalOrder.length
        const actualCount = orderedCommands.length

        if (actualCount < expectedCount) {
          console.debug(
            `Missing ${expectedCount - actualCount} commands from global order`,
          )
          // Update global metadata if necessary
          await this.updateGlobalMetadataForMissingCommands(orderedCommands)
        }
      } else {
        // Fallback: merge with sync commands first
        orderedCommands = allCommands
      }

      // Step 5: Integrity checks
      let hasIntegrityIssues = false

      if (syncMetadata && syncCommands.length > 0) {
        if (
          !(await this.metadataManager.validateCommandIntegrity(
            syncCommands,
            syncMetadata,
          ))
        ) {
          console.debug("Sync command integrity check failed")
          hasIntegrityIssues = true
        }
      }

      if (localMetadata && localCommands.length > 0) {
        if (
          !(await this.metadataManager.validateCommandIntegrity(
            localCommands,
            localMetadata,
          ))
        ) {
          console.debug("Local command integrity check failed")
          hasIntegrityIssues = true
        }
      }

      if (
        globalMetadata &&
        !(await this.metadataManager.validateGlobalConsistency(orderedCommands))
      ) {
        console.debug("Global consistency check failed")
        hasIntegrityIssues = true
      }

      if (hasIntegrityIssues) {
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
        console.warn("Command integrity check failed after all retries...")
      }

      return orderedCommands
    } catch (error) {
      console.error("Failed to load commands:", error)
      return DefaultCommands
    }
  }

  private async saveCommandsAndMetadata(
    allocation: StorageAllocation,
  ): Promise<void> {
    const syncSavePromises: Promise<void>[] = []
    const localSavePromises: Promise<boolean>[] = []

    // Save to sync storage
    allocation.sync.commands.forEach((command, index) => {
      const key = `${CMD_PREFIX}${index}`
      syncSavePromises.push(debouncedSyncSet({ [key]: command }))
    })

    // Save to local storage using BaseStorage
    allocation.local.commands.forEach((command, index) => {
      const key = `${CMD_PREFIX}local-${index}` as KEY
      localSavePromises.push(this.storage.set(key, command))
    })

    // Add metadata save to the same promise batch
    console.log(allocation.globalMetadata)
    const metadataSavePromises = [
      this.metadataManager.saveSyncCommandMetadata(allocation.syncMetadata),
      this.metadataManager.saveLocalCommandMetadata(allocation.localMetadata),
      this.metadataManager.saveGlobalCommandMetadata(allocation.globalMetadata),
    ]

    // Save commands and metadata atomically in parallel
    await Promise.all([
      await Promise.all(syncSavePromises),
      await Promise.all(localSavePromises),
      await Promise.all(metadataSavePromises),
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
    const orderedCommands: Command[] = []

    // Reorder according to global order (existing commands only)
    for (const id of order) {
      const command = commandMap.get(id)
      if (command) {
        orderedCommands.push(command)
        commandMap.delete(id)
      }
    }

    // Add new commands not in global order to the end
    orderedCommands.push(...commandMap.values())

    return orderedCommands
  }

  private async updateGlobalMetadataForMissingCommands(
    actualCommands: Command[],
  ): Promise<void> {
    const updatedGlobalMetadata: GlobalCommandMetadata = {
      globalOrder: actualCommands.map((cmd) => cmd.id),
      version: Date.now(),
      lastUpdated: Date.now(),
    }

    // Update global metadata to match actual commands
    await this.metadataManager.saveGlobalCommandMetadata(updatedGlobalMetadata)
  }
}

export const CommandStorage = {
  /**
   * Update commands to chrome sync storage.
   *
   * @returns {Promise<boolean>} true if success's
   * @throws {chrome.runtime.LastError} if error occurred
   */
  updateCommands: async (
    commands: Command[],
    hybridStorage: HybridCommandStorage,
    storage: StorageInterface = BaseStorage,
  ): Promise<boolean | chrome.runtime.LastError> => {
    const current = await hybridStorage.loadCommands()

    // If update first time, set DefaultCommands.
    const count = await storage.get<number>(STORAGE_KEY.COMMAND_COUNT)
    if (count === DEFAULT_COUNT) {
      console.debug("Update first time, set DefaultCommands.")
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
