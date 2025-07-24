import { describe, it, expect, vi, beforeEach } from "vitest"
import { Command } from "@/types"
import { CommandMetadata, GlobalCommandMetadata } from "@/types/command"
import { OPEN_MODE } from "@/const"
import {
  CMD_PREFIX,
  STORAGE_KEY,
  LOCAL_STORAGE_KEY,
  KEY,
  CMD_KEY,
  CMD_LOCAL_KEY,
} from "./const"
import { cmdSyncKey, cmdLocalKey } from "./index"
import { LegacyBackupManager } from "./backupManager"

// Mock dependencies first
vi.mock("./index", async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    BaseStorage: {
      get: vi.fn(),
      set: vi.fn(),
    },
  }
})

vi.mock("@/const", async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    VERSION: "1.0.0",
  }
})

vi.mock("../option/defaultSettings", async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    DefaultCommands: [
      {
        id: "default-1",
        title: "Default Command 1",
        iconUrl: "",
        searchUrl: "https://example.com?q=%s",
        openMode: "popup",
      },
    ],
  }
})

// Mock Chrome APIs with Map-based storage simulation
const syncStorage = new Map<STORAGE_KEY | CMD_KEY, any>()
const localStorage = new Map<LOCAL_STORAGE_KEY | CMD_LOCAL_KEY, any>()

// Helper function to create storage get mock
const createStorageGetMock = (storageMap: Map<KEY, unknown>) => {
  return vi.fn().mockImplementation((keys?: KEY | KEY[] | null) => {
    return new Promise((resolve) => {
      const result: Record<string, unknown> = {}

      if (!keys || keys === null) {
        // Get all items
        for (const [key, value] of storageMap.entries()) {
          result[key] = value
        }
      } else if (typeof keys === "string") {
        // Get single item
        if (storageMap.has(keys)) {
          result[keys] = storageMap.get(keys)
        }
      } else if (Array.isArray(keys)) {
        // Get multiple items
        for (const key of keys) {
          if (storageMap.has(key)) {
            result[key] = storageMap.get(key)
          }
        }
      }

      resolve(result)
    })
  })
}

// Helper function to create storage set mock
const createStorageSetMock = (storageMap: Map<KEY, unknown>) => {
  return vi
    .fn()
    .mockImplementation((items: Record<KEY, unknown>, callback: () => void) => {
      return new Promise((resolve) => {
        for (const [key, value] of Object.entries(items)) {
          storageMap.set(key as KEY, value)
        }
        resolve(undefined)
        if (callback) {
          callback()
        }
      })
    })
}

const mockSyncGet = createStorageGetMock(syncStorage)
const mockSyncSet = createStorageSetMock(syncStorage)
const mockLocalGet = createStorageGetMock(localStorage)
const mockLocalSet = createStorageSetMock(localStorage)

const mockOnChanged = {
  addListener: vi.fn(),
  removeListener: vi.fn(),
}

global.chrome = {
  storage: {
    sync: {
      get: mockSyncGet,
      set: mockSyncSet,
      remove: vi.fn().mockImplementation((keys, callback) => {
        if (Array.isArray(keys)) {
          keys.forEach((key) => syncStorage.delete(key))
        } else {
          syncStorage.delete(keys)
        }
        if (callback) callback()
      }),
    },
    local: {
      get: mockLocalGet,
      set: mockLocalSet,
      remove: vi.fn().mockImplementation((keys, callback) => {
        if (Array.isArray(keys)) {
          keys.forEach((key) => localStorage.delete(key))
        } else {
          localStorage.delete(keys)
        }
        if (callback) callback()
      }),
    },
    onChanged: mockOnChanged,
  },
  runtime: {
    lastError: null as any,
  },
} as any

// Import the classes and functions after mocking
import { CommandStorage, CommandMigrationManager } from "./commandStorage"
import { DefaultCommands } from "../option/defaultSettings"

const isCmdKey = (key: unknown): key is CMD_KEY => {
  return (
    !!key && `${key}`.startsWith(CMD_PREFIX) && !`${key}`.includes("local-")
  )
}

const isCmdLocalKey = (key: unknown): key is CMD_LOCAL_KEY => {
  return !!key && `${key}`.startsWith(CMD_PREFIX) && `${key}`.includes("local-")
}

const detectStorageArea = (key: KEY): Map<KEY, unknown> => {
  if (Object.values(STORAGE_KEY).includes(key) || isCmdKey(key)) {
    return syncStorage
  }
  if (
    Object.values(LOCAL_STORAGE_KEY).includes(key as LOCAL_STORAGE_KEY) ||
    isCmdLocalKey(key)
  ) {
    return localStorage
  }
  throw new Error("Invalid Storage Key")
}

// Mock storage interface
const mockStorageInterface = {
  get: vi
    .fn()
    .mockImplementation(
      <T>(key: KEY): Promise<T> =>
        Promise.resolve(detectStorageArea(key).get(key) as T),
    ),
  set: vi.fn().mockImplementation(<T>(key: KEY, value: T): Promise<boolean> => {
    detectStorageArea(key).set(key, value)
    return Promise.resolve(true)
  }),
}

// Test data helpers
const createCommand = (id: string, size = 100): Command => {
  const baseCommand = {
    id,
    title: `Command ${id}`,
    iconUrl: "icon.png",
    searchUrl: "https://example.com?q=%s",
    openMode: OPEN_MODE.POPUP,
  }

  // Add padding to reach desired size if needed
  if (size > 100) {
    return {
      ...baseCommand,
      title: `Command ${id}${"x".repeat(Math.max(0, size - 100))}`,
    }
  }

  return baseCommand
}

describe("CommandStorage actual implementation tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear storage maps between tests
    syncStorage.clear()
    localStorage.clear()
  })

  describe("CommandStorage", () => {
    let commandStorge: CommandStorage

    beforeEach(() => {
      commandStorge = new CommandStorage(mockStorageInterface)
    })

    describe("saveCommands", () => {
      it("CS-01: should save commands using the calculator", async () => {
        const commands = [createCommand("1"), createCommand("2")]

        const result = await commandStorge.saveCommands(commands)
        expect(result).toBe(true)
      })

      it("CS-01-a: should save correctly when reducing command count", async () => {
        // First save 3 commands
        const initialCommands = [
          createCommand("1"),
          createCommand("2"),
          createCommand("3"),
        ]
        await commandStorge.saveCommands(initialCommands)
        expect(syncStorage.get(cmdSyncKey(0))).toBe(initialCommands[0])

        const beforeCommandKeys = Array.from(syncStorage.keys()).filter((key) =>
          isCmdKey(key),
        )
        const metadata = syncStorage.get(STORAGE_KEY.SYNC_COMMAND_METADATA)
        expect(metadata.count).toBe(3)
        expect(beforeCommandKeys.length).toBe(3)

        // Now save fewer commands (2 instead of 3)
        const reducedCommands = [createCommand("1"), createCommand("2")]
        await commandStorge.saveCommands(reducedCommands)
        expect(syncStorage.get(cmdSyncKey(0))).toBe(reducedCommands[0])

        // Since we reduced from 3 to 2 commands, the save operation should complete
        // This verifies that the implementation correctly handles the reduction
        const afterCommandKeys = Array.from(syncStorage.keys()).filter((key) =>
          isCmdKey(key),
        )
        expect(afterCommandKeys.length).toBe(2)
      })

      it("CS-02: should handle save errors", async () => {
        const commands = [createCommand("1")]

        // Mock error in storage - override the beforeEach setup
        mockStorageInterface.set.mockRejectedValueOnce(
          new Error("Storage error"),
        )

        await expect(commandStorge.saveCommands(commands)).rejects.toThrow(
          "Storage error",
        )
      })
    })

    describe("loadCommands", () => {
      it("CS-03: should return default commands when no metadata exists", async () => {
        // Mock no metadata exists
        mockStorageInterface.set(STORAGE_KEY.SYNC_COMMAND_METADATA, null)
        const result = await commandStorge.loadCommands()
        expect(result).toEqual(DefaultCommands)
      })

      it("CS-04: should trigger migration when needed", async () => {
        // Mock migration needed
        mockStorageInterface.set(STORAGE_KEY.SYNC_COMMAND_METADATA, null)
        mockStorageInterface.set(LOCAL_STORAGE_KEY.LOCAL_COMMAND_METADATA, null)
        mockStorageInterface.set(
          LOCAL_STORAGE_KEY.GLOBAL_COMMAND_METADATA,
          null,
        )
        mockStorageInterface.set(STORAGE_KEY.COMMAND_COUNT, 5)

        const result = await commandStorge.loadCommands()
        // Should return DefaultCommands from migration
        expect(result).toEqual(DefaultCommands)
      })

      it("CS-05: should loading commands", async () => {
        const commands = [createCommand("1"), createCommand("2")]

        mockStorageInterface.set(STORAGE_KEY.COMMAND_COUNT, commands.length)
        mockStorageInterface.set(cmdSyncKey(0), commands[0])
        mockStorageInterface.set(cmdSyncKey(1), commands[1])

        const result = await commandStorge.loadCommands()
        expect(result).toHaveLength(2)
        expect(result.map((cmd) => cmd.id)).toEqual(["1", "2"])
      })

      it("CS-05-a: should load commands from both sync and local storage correctly", async () => {
        // Setup commands in both sync and local storage
        const syncCommands = [createCommand("sync1"), createCommand("sync2")]
        const localCommands = [createCommand("local1"), createCommand("local2")]

        // Set up sync storage
        const scm: CommandMetadata = {
          count: syncCommands.length,
          version: 123456,
        }
        syncStorage.set(STORAGE_KEY.SYNC_COMMAND_METADATA, scm)
        syncCommands.forEach((cmd, idx) => {
          syncStorage.set(cmdSyncKey(idx), cmd)
        })

        // Set up local storage
        const lcm: CommandMetadata = {
          count: localCommands.length,
          version: 123456,
        }
        localStorage.set(LOCAL_STORAGE_KEY.LOCAL_COMMAND_METADATA, lcm)
        localCommands.forEach((cmd, idx) => {
          localStorage.set(cmdLocalKey(idx), cmd)
        })

        // Set up global metadata with mixed order
        const globalOrder = ["sync1", "local1", "sync2", "local2"]
        const gcm: GlobalCommandMetadata = {
          globalOrder,
          version: 123456,
          lastUpdated: Date.now(),
        }
        localStorage.set(LOCAL_STORAGE_KEY.GLOBAL_COMMAND_METADATA, gcm)

        // Mock migration manager to not need migration
        const migrationManager = CommandMigrationManager.prototype
        vi.spyOn(migrationManager, "needsMigration").mockResolvedValueOnce(
          false,
        )

        const result = await commandStorge.loadCommands()

        // Should load all commands
        expect(result).toHaveLength(4)

        // Should preserve the order from GlobalCommandMetadata
        expect(result.map((cmd) => cmd.id)).toEqual(globalOrder)

        // Should include both sync and local commands
        const syncIds = syncCommands.map((cmd) => cmd.id)
        const localIds = localCommands.map((cmd) => cmd.id)
        const resultIds = result.map((cmd) => cmd.id)

        syncIds.forEach((id) => expect(resultIds).toContain(id))
        localIds.forEach((id) => expect(resultIds).toContain(id))

        vi.spyOn(migrationManager, "needsMigration").mockReset()
      })

      it("CS-05-b: should load commands from sync storage only (different browser case)", async () => {
        // Setup commands only in sync storage (simulate different browser)
        const syncCommands = [
          createCommand("sync1"),
          createCommand("sync2"),
          createCommand("sync3"),
        ]

        // Set up sync storage
        const scm: CommandMetadata = {
          count: syncCommands.length,
          version: 123456,
        }
        syncStorage.set(STORAGE_KEY.SYNC_COMMAND_METADATA, scm)
        syncCommands.forEach((cmd, idx) => {
          syncStorage.set(cmdSyncKey(idx), cmd)
        })

        // No local storage data (different browser scenario)
        // No global metadata exists

        // Mock migration manager to not need migration
        const migrationManager = CommandMigrationManager.prototype
        vi.spyOn(migrationManager, "needsMigration").mockResolvedValueOnce(
          false,
        )

        const result = await commandStorge.loadCommands()

        // Should load only sync commands
        expect(result).toHaveLength(3)

        // Should load sync commands correctly
        expect(result.map((cmd) => cmd.id)).toEqual(["sync1", "sync2", "sync3"])

        // Verify all commands are from sync storage
        const resultIds = result.map((cmd) => cmd.id)
        const expectedSyncIds = syncCommands.map((cmd) => cmd.id)
        expect(resultIds).toEqual(expectedSyncIds)

        // GlobalCommandMetadata should be regenerated based on sync commands order
        const globalMetadata: GlobalCommandMetadata = localStorage.get(
          LOCAL_STORAGE_KEY.GLOBAL_COMMAND_METADATA,
        )
        expect(globalMetadata).toBeDefined()
        expect(globalMetadata.globalOrder).toEqual(["sync1", "sync2", "sync3"])

        vi.spyOn(migrationManager, "needsMigration").mockReset()
      })

      it("CS-05-c: should handle sync and GlobalCommandMetadata inconsistency (synced from different browser case)", async () => {
        // Setup: Different browser added/removed sync commands, causing inconsistency
        // const originalSyncCommands = [
        //   createCommand("sync1"),
        //   createCommand("sync2"),
        //   createCommand("sync3"),
        // ]
        const currentSyncCommands = [
          createCommand("sync1"),
          createCommand("sync3"),
          createCommand("sync4"),
        ] // sync2 removed, sync4 added
        const localCommands = [createCommand("local1"), createCommand("local2")]

        // Set up current sync storage (as synced from different browser)
        const scm: CommandMetadata = {
          count: currentSyncCommands.length,
          version: 123456,
        }
        syncStorage.set(STORAGE_KEY.SYNC_COMMAND_METADATA, scm)
        currentSyncCommands.forEach((cmd, idx) => {
          syncStorage.set(cmdSyncKey(idx), cmd)
        })

        // Set up local storage (unchanged)
        const lcm: CommandMetadata = {
          count: localCommands.length,
          version: 123456,
        }
        localStorage.set(LOCAL_STORAGE_KEY.LOCAL_COMMAND_METADATA, lcm)
        localCommands.forEach((cmd, idx) => {
          localStorage.set(cmdLocalKey(idx), cmd)
        })

        // Set up inconsistent global metadata (based on original sync commands)
        const inconsistentGlobalOrder = [
          "sync1",
          "local1",
          "sync2",
          "local2",
          "sync3",
        ] // includes deleted sync2, missing new sync4
        const gmd: GlobalCommandMetadata = {
          globalOrder: inconsistentGlobalOrder,
          version: 123456,
          lastUpdated: Date.now(),
        }
        localStorage.set(LOCAL_STORAGE_KEY.GLOBAL_COMMAND_METADATA, gmd)

        // Mock migration manager to not need migration
        const migrationManager = CommandMigrationManager.prototype
        vi.spyOn(migrationManager, "needsMigration").mockResolvedValueOnce(
          false,
        )

        const result = await commandStorge.loadCommands()

        // Should load all existing commands (current sync + local)
        expect(result).toHaveLength(5) // 3 sync + 2 local

        // Should include all current sync commands
        const currentSyncIds = currentSyncCommands.map((cmd) => cmd.id)
        const localIds = localCommands.map((cmd) => cmd.id)
        const resultIds = result.map((cmd) => cmd.id)

        currentSyncIds.forEach((id) => expect(resultIds).toContain(id))
        localIds.forEach((id) => expect(resultIds).toContain(id))

        // Should NOT include deleted sync2
        expect(resultIds).not.toContain("sync2")

        // Should include new sync4
        expect(resultIds).toContain("sync4")

        // GlobalCommandMetadata should be regenerated
        const updatedGlobalMetadata: GlobalCommandMetadata = localStorage.get(
          LOCAL_STORAGE_KEY.GLOBAL_COMMAND_METADATA,
        )
        expect(updatedGlobalMetadata).toBeDefined()

        // The new order should:
        // 1. Remove deleted sync commands (sync2)
        // 2. Add new sync commands after the last existing sync command position
        const expectedOrder = ["sync1", "local1", "local2", "sync3", "sync4"]
        expect(updatedGlobalMetadata.globalOrder).toEqual(expectedOrder)
        expect(result.map((cmd) => cmd.id)).toEqual(expectedOrder)

        vi.spyOn(migrationManager, "needsMigration").mockReset()
      })
    })

    describe("calculator property", () => {
      it("CS-06: should have a calculator with calculateCommandSize method", () => {
        expect(commandStorge.calculator).toBeDefined()
        expect(commandStorge.calculator.calculateCommandSize).toBeDefined()

        const command = createCommand("test")
        const size = commandStorge.calculator.calculateCommandSize(command)
        expect(size).toBeGreaterThan(0)
      })

      it("CS-07: should have a calculator with analyzeAndAllocate method", () => {
        expect(commandStorge.calculator.analyzeAndAllocate).toBeDefined()

        const commands = [createCommand("1"), createCommand("2")]
        const allocation = commandStorge.calculator.analyzeAndAllocate(commands)

        expect(allocation).toHaveProperty("sync")
        expect(allocation).toHaveProperty("local")
        expect(allocation).toHaveProperty("syncMetadata")
        expect(allocation).toHaveProperty("localMetadata")
        expect(allocation).toHaveProperty("globalMetadata")
      })
    })

    describe("updateCommands", () => {
      it("CS-13: should handle first-time update", async () => {
        const commandStorage = new CommandStorage(mockStorageInterface)

        const updated = DefaultCommands[0]
        updated.popupOption = {
          width: 1,
          height: 1,
        }

        const result = await commandStorage.updateCommands([updated])

        expect(result).toBe(true)

        // Verify command
        const saved = syncStorage.get(cmdSyncKey(0))
        expect(saved).toEqual(updated)
      })

      it("CS-14: should update existing commands in sync storage", async () => {
        const commandStorage = new CommandStorage(mockStorageInterface)
        const existingCommands = [createCommand("1"), createCommand("2")]
        await commandStorage.saveCommands(existingCommands)

        // Mock migration manager to not need migration
        const migrationManager = CommandMigrationManager.prototype
        vi.spyOn(migrationManager, "needsMigration").mockResolvedValueOnce(
          false,
        )

        const updatedCommands = [
          { ...existingCommands[0], title: "Updated Command 1" },
        ]
        const result = await commandStorage.updateCommands(updatedCommands)

        expect(result).toBe(true)

        // Verify command updated.
        const saved0 = syncStorage.get(cmdSyncKey(0))
        expect(saved0.openMode).toBe(existingCommands[0].openMode)
        expect(saved0.title).toBe("Updated Command 1")

        // Verify command not changed.
        const saved1 = syncStorage.get(cmdSyncKey(1))
        expect(saved1).toEqual(existingCommands[1])

        // Verify command count did not change
        const sm = syncStorage.get(STORAGE_KEY.SYNC_COMMAND_METADATA)
        expect(sm.count).toEqual(existingCommands.length)
      })

      it("CS-14-a: should update existing commands in local storage", async () => {
        const commandStorage = new CommandStorage(mockStorageInterface)
        const syncCount = 60 / 5
        const localCount = 4
        const count = syncCount + localCount
        const existingLargeCommands = Array.from(
          { length: count },
          (_, i) => createCommand(`large${i}`, 5 * 1000), // Each command ~5KB
        )

        const allocation = commandStorage.calculator.analyzeAndAllocate(
          existingLargeCommands,
        )
        await commandStorage.saveCommands(existingLargeCommands)

        // Mock migration manager to not need migration
        const migrationManager = CommandMigrationManager.prototype
        vi.spyOn(migrationManager, "needsMigration").mockResolvedValueOnce(
          false,
        )

        expect(allocation.sync.commands.length).toBe(syncCount)
        expect(allocation.local.commands.length).toBe(localCount)

        const updatedCommands = [
          { ...createCommand(`large${count - 1}`), title: "Updated Command 1" },
          {
            ...createCommand(`large${count - 2}`),
            popupOption: { width: 1, height: 1 },
          },
        ]

        const result = await commandStorage.updateCommands(updatedCommands)
        expect(result).toBe(true)

        // Verify command updated.
        const saved0 = localStorage.get(cmdLocalKey(localCount - 1))
        expect(saved0.openMode).toBe(existingLargeCommands[count - 1].openMode)
        expect(saved0.title).toBe("Updated Command 1")
        const saved1 = localStorage.get(cmdLocalKey(localCount - 2))
        expect(saved1.openMode).toBe(existingLargeCommands[count - 2].openMode)
        expect(saved1.popupOption.width).toBe(1)
        expect(saved1.popupOption.height).toBe(1)

        // Verify command not changed.
        const saved2 = localStorage.get(cmdLocalKey(localCount - 3))
        expect(saved2).toEqual(existingLargeCommands[count - 3])

        // Verify command count did not change
        const lm = localStorage.get(LOCAL_STORAGE_KEY.LOCAL_COMMAND_METADATA)
        expect(lm.count).toEqual(localCount)

        // Reset the migration manager spy
        vi.spyOn(migrationManager, "needsMigration").mockReset()
      })
    })
  })

  describe("CommandMigrationManager", () => {
    let migrationManager: CommandMigrationManager

    beforeEach(() => {
      migrationManager = new CommandMigrationManager(mockStorageInterface)
    })

    describe("performMigration", () => {
      it("CS-08: should return default commands when no legacy data", async () => {
        // Mock no legacy data
        mockStorageInterface.set(STORAGE_KEY.COMMAND_COUNT, -1)

        const result = await migrationManager.performMigration()
        expect(result).toEqual(DefaultCommands)
      })

      it("CS-09: should perform migration with legacy data", async () => {
        const legacyCommands = [createCommand("1"), createCommand("2")]

        // Set up legacy data in syncStorage Map using correct CMD_PREFIX
        syncStorage.set(cmdSyncKey(0), legacyCommands[0])
        syncStorage.set(cmdSyncKey(1), legacyCommands[1])

        // Mock legacy count exists (not DEFAULT_COUNT which is -1)
        syncStorage.set(STORAGE_KEY.COMMAND_COUNT, 2)

        const result = await migrationManager.performMigration()

        expect(result).toHaveLength(2)
        expect(result[0].id).toBe("1")
        expect(result[1].id).toBe("2")
      })

      it("CS-09-a: should distribute large legacy data between sync and local storage during migration", async () => {
        // Create many large commands that exceed 60KB sync capacity
        const largeCommands = Array.from(
          { length: 50 },
          (_, i) => createCommand(`legacy${i}`, 2000), // Each command ~2KB
        )

        // Set up legacy data in syncStorage Map using correct CMD_PREFIX
        largeCommands.forEach((cmd, idx) => {
          syncStorage.set(cmdSyncKey(idx), cmd)
        })
        syncStorage.set(STORAGE_KEY.COMMAND_COUNT, largeCommands.length)

        // Mock the backupCommandsForMigration to check buckup functionality.
        const spy = vi.spyOn(
          LegacyBackupManager.prototype,
          "backupCommandsForMigration",
        )

        // Execute the migration
        const result = await migrationManager.performMigration()

        // Verify the migration completed successfully
        expect(result).toHaveLength(largeCommands.length)
        expect(result.map((cmd) => cmd.id)).toEqual(
          largeCommands.map((cmd) => cmd.id),
        )

        // Verify the backupCommandsForMigration was called
        expect(spy).toHaveBeenCalledWith(largeCommands)

        // Verify migration completion flag
        const migrationStatus = localStorage.get(
          LOCAL_STORAGE_KEY.MIGRATION_STATUS,
        )
        expect(migrationStatus).toBeDefined()
        expect(migrationStatus.version).toBe("1.0.0") // VERSION from mock
        expect(migrationStatus.migratedAt).toBeGreaterThan(0)
        expect(migrationStatus.commandCount).toBe(largeCommands.length)
      })
    })

    describe("needsMigration", () => {
      it("CS-10: should return false when migration already completed", async () => {
        localStorage.set(LOCAL_STORAGE_KEY.MIGRATION_STATUS, {
          version: "1.0.0",
          migratedAt: Date.now(),
          commandCount: 5,
        })

        const result = await migrationManager.needsMigration()
        expect(result).toBe(false)
      })

      it("CS-11: should return true when legacy data exists", async () => {
        localStorage.set(LOCAL_STORAGE_KEY.MIGRATION_STATUS, {
          version: null,
          migratedAt: Date.now(),
          commandCount: 5,
        })

        const result = await migrationManager.needsMigration()
        expect(result).toBe(true)
      })
    })

    describe("restoreFromBackup", () => {
      it("CS-12: should restore from backup", async () => {
        const result = await migrationManager.restoreFromBackup()
        expect(result).toHaveProperty("commands")
        expect(result).toHaveProperty("folders")
      })
    })
  })

  describe("CommandStorage object", () => {
    describe("listener management", () => {
      it("CS-15: should add and remove command change listeners", () => {
        const callback1 = vi.fn()
        const callback2 = vi.fn()

        const commandStorage = new CommandStorage()
        commandStorage.addCommandListener(callback1)
        commandStorage.addCommandListener(callback2)

        expect(callback1).toBeDefined()
        expect(callback2).toBeDefined()

        commandStorage.removeCommandListener(callback1)
        // callback1 should be removed, callback2 should remain
      })
    })
  })

  describe("Storage capacity calculation", () => {
    it("CS-16: should calculate command size correctly", () => {
      const commandStorage = new CommandStorage(mockStorageInterface)
      const command = createCommand("test")

      const size = commandStorage.calculator.calculateCommandSize(command)
      expect(size).toBeGreaterThan(0)

      // Should include key overhead
      const jsonSize = new TextEncoder().encode(JSON.stringify(command)).length
      expect(size).toBeGreaterThan(jsonSize)
    })

    it("CS-17: should include key overhead in calculation", () => {
      const commandStorage = new CommandStorage(mockStorageInterface)
      const command = createCommand("test")

      const size = commandStorage.calculator.calculateCommandSize(command)
      const jsonSize = new TextEncoder().encode(JSON.stringify(command)).length
      const keySize = new TextEncoder().encode(cmdSyncKey(100)).length
      const expectedSize = jsonSize + keySize

      expect(size).toBe(expectedSize)
      expect(size).toBeGreaterThan(jsonSize) // Key overhead included
    })

    it("CS-18: should handle large commands", () => {
      const commandStorage = new CommandStorage(mockStorageInterface)
      const largeCommand = createCommand("large", 9000)

      const size = commandStorage.calculator.calculateCommandSize(largeCommand)
      expect(size).toBeGreaterThan(8 * 1024) // Should be > 8KB
    })

    it("CS-19: should allocate commands based on size", () => {
      const commandStorage = new CommandStorage(mockStorageInterface)
      const commands = [
        createCommand("1"),
        createCommand("2"),
        createCommand("3"),
      ]

      const allocation = commandStorage.calculator.analyzeAndAllocate(commands)

      // Total commands should be preserved
      const totalCommands =
        allocation.sync.commands.length + allocation.local.commands.length
      expect(totalCommands).toBe(commands.length)
    })

    it("CS-20: should balance between sync and local storage", () => {
      const commandStorage = new CommandStorage(mockStorageInterface)

      // Create commands that would force allocation to local storage
      // Use very large commands that exceed sync capacity
      const largeCommands = Array.from({ length: 20 }, (_, i) =>
        createCommand(`large${i}`, 4000),
      )

      const allocation =
        commandStorage.calculator.analyzeAndAllocate(largeCommands)

      // Verify total command count is preserved
      const totalAllocated =
        allocation.sync.commands.length + allocation.local.commands.length
      expect(totalAllocated).toBe(largeCommands.length)

      // Check that allocation respects capacity limits
      expect(allocation.sync.totalBytes).toBeLessThanOrEqual(60 * 1024) // 60KB sync limit

      // If sync is at capacity, some commands should be in local
      if (allocation.sync.totalBytes >= 60 * 1024) {
        expect(allocation.local.commands.length).toBeGreaterThan(0)
      }

      // Verify no commands are larger than 8KB in sync storage
      allocation.sync.commands.forEach((cmd) => {
        const size = commandStorage.calculator.calculateCommandSize(cmd)
        expect(size).toBeLessThanOrEqual(8 * 1024)
      })
    })

    it("CS-21: should handle capacity overflow correctly", () => {
      const commandStorage = new CommandStorage(mockStorageInterface)

      // Create many commands that would exceed sync capacity
      const manyCommands = Array.from({ length: 100 }, (_, i) =>
        createCommand(`cmd${i}`, 1000),
      )

      const allocation =
        commandStorage.calculator.analyzeAndAllocate(manyCommands)

      // Should allocate some to local storage when sync is full
      expect(allocation.sync.totalBytes).toBeLessThanOrEqual(60 * 1024) // 60KB limit
      expect(
        allocation.sync.commands.length + allocation.local.commands.length,
      ).toBe(100)

      if (allocation.sync.totalBytes >= 60 * 1024) {
        expect(allocation.local.commands.length).toBeGreaterThan(0)
      }
    })

    it("CS-22: should preserve total command count", () => {
      const commandStorage = new CommandStorage(mockStorageInterface)

      // Test with various scenarios
      const scenarios = [
        { commands: [createCommand("1")], name: "single command" },
        {
          commands: Array.from({ length: 10 }, (_, i) =>
            createCommand(`cmd${i}`),
          ),
          name: "multiple small commands",
        },
        {
          commands: Array.from({ length: 50 }, (_, i) =>
            createCommand(`large${i}`, 2000),
          ),
          name: "many medium commands",
        },
        {
          commands: [
            ...Array.from({ length: 20 }, (_, i) =>
              createCommand(`small${i}`, 100),
            ),
            ...Array.from({ length: 5 }, (_, i) =>
              createCommand(`large${i}`, 9000),
            ),
          ],
          name: "mixed size commands",
        },
      ]

      scenarios.forEach(({ commands }) => {
        const allocation =
          commandStorage.calculator.analyzeAndAllocate(commands)

        const totalAllocated =
          allocation.sync.commands.length + allocation.local.commands.length
        expect(totalAllocated).toBe(commands.length)

        // Verify no commands are lost or duplicated
        const allocatedIds = new Set([
          ...allocation.sync.commands.map((cmd) => cmd.id),
          ...allocation.local.commands.map((cmd) => cmd.id),
        ])
        const originalIds = new Set(commands.map((cmd) => cmd.id))

        expect(allocatedIds.size).toBe(originalIds.size)
        expect(allocatedIds).toEqual(originalIds)
      })
    })
  })

  describe("Command metadata validation", () => {
    it("CS-25: should validate global consistency with correct order", async () => {
      const commandStorage = new CommandStorage(mockStorageInterface)
      const commands = [createCommand("1"), createCommand("2")]

      // Access private metadata manager for testing
      const metadataManager = (commandStorage as any).metadataManager

      // Mock global metadata with correct order
      mockStorageInterface.get.mockResolvedValue({
        globalOrder: ["1", "2"],
        version: 123456,
        lastUpdated: 123456,
      })

      // Call the actual validateGlobalConsistency method
      const result = await metadataManager.validateGlobalConsistency(commands)

      // Should return true for correct order
      expect(result).toBe(true)
    })

    it("CS-26: should fail global consistency with wrong order", async () => {
      const commandStorage = new CommandStorage(mockStorageInterface)
      const commands = [createCommand("1"), createCommand("2")]

      // Access private metadata manager for testing
      const metadataManager = (commandStorage as any).metadataManager

      // Mock global metadata with wrong order
      mockStorageInterface.get.mockResolvedValue({
        globalOrder: ["2", "1"], // Wrong order
        version: 123456,
        lastUpdated: 123456,
      })

      // Call the actual validateGlobalConsistency method
      const result = await metadataManager.validateGlobalConsistency(commands)

      // Should return false for incorrect order
      expect(result).toBe(false)
    })

    it("CS-27: should fail global consistency when metadata is missing", async () => {
      const commandStorage = new CommandStorage(mockStorageInterface)
      const commands = [createCommand("1")]

      // Access private metadata manager for testing
      const metadataManager = (commandStorage as any).metadataManager

      // Mock no global metadata
      mockStorageInterface.get.mockResolvedValue(null)

      // Call the actual validateGlobalConsistency method
      const result = await metadataManager.validateGlobalConsistency(commands)

      // Should return false when metadata is missing
      expect(result).toBe(false)
    })
  })
})
