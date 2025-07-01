import DefaultSettings, { DefaultCommands } from './option/defaultSettings'
import { Command, CaptureDataStorage } from '@/types'

const SYNC_DEBOUNCE_DELAY = 10

let syncSetTimeout: NodeJS.Timeout | null
let syncSetResolves: (() => void)[] = []
const syncSetData = new Map<string, unknown>()

chrome.storage.sync.getBytesInUse(['0', '2', '3', '4'], (bytes) => {
  console.log('bytes', bytes)
            })

const debouncedSyncSet = (data: Record<string, unknown>): Promise<void> => {
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
        syncSetResolves.forEach((resolve) => resolve())
        syncSetResolves = []
      })
    }, SYNC_DEBOUNCE_DELAY)
    syncSetResolves.push(resolve)
  })
}

export enum STORAGE_KEY {
  USER = 0,
  COMMAND_COUNT = 2,
  USER_STATS = 3,
  SHORTCUTS = 4,
  COMMAND_METADATA = 5,
}

export enum LOCAL_STORAGE_KEY {
  CACHES = 'caches',
  CLIENT_ID = 'clientId',
  STARS = 'stars',
  CAPTURES = 'captures',
  COMMAND_LOCAL_COUNT = 'commandLocalCount',
  MIGRATION_STATUS = 'migrationStatus',
  COMMANDS_BACKUP = 'commandsBackup',
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
  [STORAGE_KEY.COMMAND_METADATA]: null,
  [LOCAL_STORAGE_KEY.CACHES]: {
    images: {},
  },
  [LOCAL_STORAGE_KEY.CLIENT_ID]: '',
  [LOCAL_STORAGE_KEY.STARS]: [],
  [LOCAL_STORAGE_KEY.CAPTURES]: {},
  [LOCAL_STORAGE_KEY.COMMAND_LOCAL_COUNT]: 0,
  [LOCAL_STORAGE_KEY.MIGRATION_STATUS]: null,
  [LOCAL_STORAGE_KEY.COMMANDS_BACKUP]: null,
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    const count = await Storage.get<number>(STORAGE_KEY.COMMAND_COUNT)
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

async function cleanupLegacyCommandData(): Promise<void> {
  try {
    const count = await Storage.get<number>(STORAGE_KEY.COMMAND_COUNT)
    if (count > 0) {
      const keysToRemove = Array.from(
        { length: count },
        (_, i) => `${CMD_PREFIX}${i}`,
      )
      console.info(
        'Cleaning up legacy command data:',
        keysToRemove.length,
        'items',
      )
      await chrome.storage.sync.remove(keysToRemove)
      await Storage.set(STORAGE_KEY.COMMAND_COUNT, DEFAULT_COUNT)
      console.info('Legacy command data cleaned up successfully')
    }
  } catch (error) {
    console.warn('Failed to cleanup legacy data:', error)
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
    await Storage.set(this.METADATA_KEY, metadata)

    // Also save local count to local storage (redundancy)
    await Storage.set(this.LOCAL_COUNT_KEY, metadata.localCount)
  }

  async loadMetadata(): Promise<CommandMetadata | null> {
    try {
      const metadata = await Storage.get<CommandMetadata>(this.METADATA_KEY)
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
    const oldCount = await Storage.get<number>(STORAGE_KEY.COMMAND_COUNT)

    // When metadata doesn't exist but legacy format data exists
    return !metadata && oldCount !== DEFAULT_COUNT
  }
}

// Migration management class
class CommandMigrationManager {
  private readonly MIGRATION_VERSION = 'v2.0'
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
      await this.backupLegacyData(legacyCommands)

      // Step 3: Save in new format
      const hybridStorage = new HybridCommandStorage()
      await hybridStorage.saveCommands(legacyCommands)

      // Step 4: Set migration completion flag
      await Storage.set(this.MIGRATION_FLAG_KEY, {
        version: this.MIGRATION_VERSION,
        migratedAt: Date.now(),
        commandCount: legacyCommands.length,
      })

      // Step 5: Delete legacy format data (delayed for safety)
      setTimeout(() => cleanupLegacyCommandData(), 5000)

      console.debug(
        `Migration completed: ${legacyCommands.length} commands migrated`,
      )
      return legacyCommands
    } catch (error) {
      console.error('Migration failed:', error)

      // Attempt to restore from backup when migration fails
      const backupCommands = await this.restoreFromBackup()
      if (backupCommands.length > 0) {
        console.debug(
          `Migration failed, but restored ${backupCommands.length} commands from backup`,
        )
        return backupCommands
      }

      throw new Error(
        `Command migration failed: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  async needsMigration(): Promise<boolean> {
    try {
      const migrationStatus = (await Storage.get(this.MIGRATION_FLAG_KEY)) as {
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

    const legacyCount = await Storage.get<number>(STORAGE_KEY.COMMAND_COUNT)
    return legacyCount !== DEFAULT_COUNT
  }

  private async backupLegacyData(commands: Command[]): Promise<void> {
    const backup = {
      version: 'legacy',
      timestamp: Date.now(),
      commands: commands,
      originalCount: commands.length,
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
class HybridCommandStorage {
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

// Export migration management class
export { CommandMigrationManager }

export const Storage = {
  /**
   * Get a item from chrome sync storage.
   *
   * @param {STORAGE_KEY} key of item in storage.
   */
  get: async <T>(key: KEY): Promise<T> => {
    const area = detectStorageArea(key)
    const result = await area.get(`${key}`)
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removeListener: (key: KEY, cb: ChangedCallback<any>) => {
    changedCallbacks[key] = changedCallbacks[key]?.filter((f) => f !== cb)
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

  // New methods for hybrid storage
  hybridStorage: new HybridCommandStorage(),

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
}
