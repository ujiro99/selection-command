import { DefaultCommands } from "../option/defaultSettings"
import { Command } from "@/types"
import { CommandMetadata, GlobalCommandMetadata } from "@/types/command"
import {
  BaseStorage,
  STORAGE_KEY,
  LOCAL_STORAGE_KEY,
  CMD_PREFIX,
  KEY,
  CMD_KEY,
  CMD_LOCAL_KEY,
  cmdSyncKey,
  cmdLocalKey,
  debouncedSyncSet,
} from "./index"
import { VERSION } from "@/const"
import { LegacyBackupManager } from "@/services/storage/backupManager"

// Storage interface for dependency injection
interface StorageInterface {
  get<T>(key: KEY): Promise<T>
  set<T>(key: KEY, value: T): Promise<boolean>
}

// Command change callbacks
export type commandChangedCallback = () => void
const commandChangedCallbacks = [] as commandChangedCallback[]

// Setup command change listener
chrome.storage.onChanged.addListener((changes) => {
  const commands = [] as Command[]
  for (const [k, { newValue }] of Object.entries(changes)) {
    if (k.startsWith(CMD_PREFIX)) commands.push(newValue)
  }
  if (commands.length > 0) {
    commandChangedCallbacks.forEach((cb) => cb())
  }
})

const DEFAULT_COUNT = -1

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

    const keys = Array.from({ length: count }, (_, i) => cmdSyncKey(i))
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
    const keyOverhead = new TextEncoder().encode(cmdSyncKey(100)).length

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
    const timestamp = Date.now()
    return {
      syncMetadata: {
        count: syncCount,
        version: timestamp,
      },
      localMetadata: {
        count: localCount,
        version: timestamp,
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

  async saveCommandMetadata(
    sync: CommandMetadata,
    local: CommandMetadata,
  ): Promise<void> {
    await Promise.all([
      this.storage.set(this.SYNC_METADATA_KEY, sync),
      this.storage.set(this.LOCAL_METADATA_KEY, local),
    ])
  }

  async saveGlobalCommandMetadata(
    metadata: GlobalCommandMetadata,
  ): Promise<void> {
    await this.storage.set(this.GLOBAL_METADATA_KEY, metadata)
  }

  async loadCommandMetadata(): Promise<
    [CommandMetadata, CommandMetadata] | [null, null]
  > {
    try {
      const metadata = await Promise.all([
        this.storage.get<CommandMetadata>(this.SYNC_METADATA_KEY),
        this.storage.get<CommandMetadata>(this.LOCAL_METADATA_KEY),
      ])
      return metadata
    } catch (error) {
      console.error("Failed to load sync metadata:", error)
      return [null, null]
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
    const [metadata, globalMetadata] = await Promise.all([
      this.loadCommandMetadata(),
      this.loadGlobalCommandMetadata(),
    ])
    const [syncMetadata, localMetadata] = metadata
    const legacyCount = await this.storage.get<number>(
      STORAGE_KEY.COMMAND_COUNT,
    )

    // When new metadata doesn't exist but legacy format data exists
    return (
      !syncMetadata &&
      !localMetadata &&
      !globalMetadata &&
      legacyCount !== DEFAULT_COUNT
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
      // Step 1: Load legacy format data
      const legacyCommands = await loadLegacyCommandData(this.storage)
      if (legacyCommands.length === 0) {
        return DefaultCommands
      }

      // Step 2: Backup data
      const legacyBackupManager = new LegacyBackupManager()
      await legacyBackupManager.backupCommandsForMigration(legacyCommands)

      // Step 3: Save in new format
      const commandStorage = new CommandStorage(this.storage)
      await commandStorage.saveCommands(legacyCommands, true)

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
    return true
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

// Command storage class
export class CommandStorage {
  public calculator = new StorageCapacityCalculator()
  private metadataManager: CommandMetadataManager
  private storage: StorageInterface

  constructor(storage: StorageInterface = BaseStorage) {
    this.storage = storage
    this.metadataManager = new CommandMetadataManager(this.storage)
  }

  async saveCommands(commands: Command[], migration = false): Promise<boolean> {
    try {
      // Step 1: Determine storage allocation
      const allocation = this.calculator.analyzeAndAllocate(commands)

      // Step 2: Save commands and metadata atomically
      if (migration) {
        await this.saveCommandsAndMetadata(allocation, commands.length)
      } else {
        await this.saveCommandsAndMetadata(allocation)
      }
      return true
    } catch (error) {
      console.error("Failed to save commands:", error)
      throw error
    }
  }

  async loadCommands(): Promise<Command[]> {
    try {
      // Step 1: Check if migration is needed
      const migrationManager = new CommandMigrationManager(this.storage)
      const [needsMigrationByManager, needsMigrationByMetadata] =
        await Promise.all([
          migrationManager.needsMigration(),
          this.metadataManager.needsMigration(),
        ])

      if (needsMigrationByManager || needsMigrationByMetadata) {
        console.debug("Migration needed, performing migration...")
        return await migrationManager.performMigration()
      }

      // Step 2: Load metadata
      const [metadata, globalMetadata] = await Promise.all([
        this.metadataManager.loadCommandMetadata(),
        this.metadataManager.loadGlobalCommandMetadata(),
      ])
      const [syncMetadata, localMetadata] = metadata

      if (!syncMetadata && !localMetadata && !globalMetadata) {
        // First load, return default commands.
        console.debug("No metadata found, returning default commands...")
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
          await this.updateGlobalMetadata(orderedCommands)
        }
      } else {
        // Fallback: merge with sync commands first
        orderedCommands = allCommands
        await this.updateGlobalMetadata(orderedCommands)
      }

      // Step 5: Global Consistency checks
      if (
        globalMetadata &&
        !(await this.metadataManager.validateGlobalConsistency(orderedCommands))
      ) {
        console.debug("Global consistency check failed")
        await this.updateGlobalMetadata(orderedCommands)
      }

      return orderedCommands
    } catch (error) {
      console.error("Failed to load commands:", error)
      throw error
    }
  }

  /**
   * Update commands to chrome sync/local storage.
   *
   * @returns {Promise<boolean>} true if success's
   * @throws {chrome.runtime.LastError} if error occurred
   */
  async updateCommands(
    commands: Command[],
  ): Promise<boolean | chrome.runtime.LastError> {
    const [syncMetadata, localMetadata] =
      await this.metadataManager.loadCommandMetadata()

    // If update first time, set DefaultCommands.
    if (!syncMetadata) {
      console.debug("Update first time, set DefaultCommands.")
      const updated = DefaultCommands.reduce(
        (acc, cmd, i) => {
          const found = commands.find((c) => c.id === cmd.id)
          if (found) {
            acc[cmdSyncKey(i)] = found
          }
          return acc
        },
        {} as { [key: CMD_KEY]: Command },
      )
      if (Object.keys(updated).length > 0) await debouncedSyncSet(updated)
      return true
    }

    // For sync
    const commandInSync = await this.loadFromSync(syncMetadata?.count || 0)
    let newCommands = commandInSync.reduce(
      (acc, cmd, i) => {
        const newCmd = commands.find((c) => c.id === cmd.id)
        if (newCmd) {
          acc[cmdSyncKey(i)] = newCmd
        }
        return acc
      },
      {} as { [key: CMD_KEY]: Command },
    )
    if (Object.keys(newCommands).length > 0) await debouncedSyncSet(newCommands)

    // For local
    const commandInLocal = await this.loadFromLocal(localMetadata?.count || 0)
    newCommands = commandInLocal.reduce(
      (acc, cmd, i) => {
        const newCmd = commands.find((c) => c.id === cmd.id)
        if (newCmd) {
          acc[cmdLocalKey(i)] = newCmd
        }
        return acc
      },
      {} as { [key: CMD_LOCAL_KEY]: Command },
    )
    if (Object.keys(newCommands).length > 0)
      await chrome.storage.local.set(newCommands)

    return true
  }

  addCommandListener(cb: commandChangedCallback) {
    commandChangedCallbacks.push(cb)
  }

  removeCommandListener(cb: commandChangedCallback) {
    const idx = commandChangedCallbacks.findIndex((f) => f === cb)
    if (idx !== -1) commandChangedCallbacks.splice(idx, 1)
  }

  private async saveCommandsAndMetadata(
    allocation: StorageAllocation,
    legacyCount?: number,
  ): Promise<void> {
    const syncSavePromises: Promise<void>[] = []
    const localSavePromises: Promise<boolean>[] = []

    // Load count
    const [syncMetadata, localMetadata] =
      await this.metadataManager.loadCommandMetadata()
    const preSyncCount = syncMetadata?.count || legacyCount || 0
    const preLocalCount = localMetadata?.count || 0

    // Save to sync storage
    allocation.sync.commands.forEach((command, index) => {
      const key = cmdSyncKey(index)
      syncSavePromises.push(debouncedSyncSet({ [key]: command }))
    })

    // Save to local storage using BaseStorage
    allocation.local.commands.forEach((command, index) => {
      const key = cmdLocalKey(index)
      localSavePromises.push(this.storage.set(key, command))
    })

    // Add metadata save to the same promise batch
    const metadataSavePromises = [
      this.metadataManager.saveCommandMetadata(
        allocation.syncMetadata,
        allocation.localMetadata,
      ),
      this.metadataManager.saveGlobalCommandMetadata(allocation.globalMetadata),
    ]

    // Save commands and metadata atomically in parallel
    await Promise.all([
      ...syncSavePromises,
      ...localSavePromises,
      ...metadataSavePromises,
    ])

    // Remove surplus commands
    const syncCount = allocation.syncMetadata.count
    if (preSyncCount > syncCount) {
      const removeKeys = getIndicesToRemove(preSyncCount, syncCount).map((i) =>
        cmdSyncKey(i),
      )
      await chrome.storage.sync.remove(removeKeys)
    }
    const localCount = allocation.localMetadata.count
    if (preLocalCount > localCount) {
      const removeKeys = getIndicesToRemove(preLocalCount, localCount).map(
        (i) => cmdLocalKey(i),
      )
      await chrome.storage.local.remove(removeKeys)
    }
  }

  private async loadFromSync(count: number): Promise<Command[]> {
    if (count === 0) return []

    const keys = Array.from({ length: count }, (_, i) => cmdSyncKey(i))
    const result = await chrome.storage.sync.get(keys)

    return keys.map((key) => result[key]).filter((cmd) => cmd != null)
  }

  private async loadFromLocal(count: number): Promise<Command[]> {
    if (count === 0) return []

    const keys = Array.from({ length: count }, (_, i) => cmdLocalKey(i))
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

  private async updateGlobalMetadata(actualCommands: Command[]): Promise<void> {
    const updatedGlobalMetadata: GlobalCommandMetadata = {
      globalOrder: actualCommands.map((cmd) => cmd.id),
      version: Date.now(),
      lastUpdated: Date.now(),
    }
    // Update global metadata to match actual commands
    await this.metadataManager.saveGlobalCommandMetadata(updatedGlobalMetadata)
  }
}
