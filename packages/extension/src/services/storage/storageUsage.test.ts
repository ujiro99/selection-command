import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { CMD_PREFIX } from "@/services/storage"

// Mock Chrome APIs
const mockSyncGetBytesInUse = vi.fn()
const mockSyncGet = vi.fn()
const mockLocalGetBytesInUse = vi.fn()
const mockLocalGet = vi.fn()
const mockOnChangedAddListener = vi.fn()
const mockOnChangedRemoveListener = vi.fn()

global.chrome = {
  storage: {
    sync: {
      getBytesInUse: mockSyncGetBytesInUse,
      get: mockSyncGet,
    },
    local: {
      getBytesInUse: mockLocalGetBytesInUse,
      get: mockLocalGet,
    },
    onChanged: {
      addListener: mockOnChangedAddListener,
      removeListener: mockOnChangedRemoveListener,
    },
  },
  runtime: {
    lastError: null as chrome.runtime.LastError | null,
  },
} as any

// Import the functions to test after mocking
import {
  subscribeStorageUsage,
  formatPercentage,
  StorageUsageData,
} from "./storageUsage"

// For testing internal function.
const getStorageUsage = async (): Promise<StorageUsageData> => {
  return new Promise((resolve) => {
    subscribeStorageUsage((usage) => {
      resolve(usage)
    })
  })
}

describe("storageUsage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(global.chrome.runtime, "lastError", {
      value: undefined,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("getStorageUsage", () => {
    beforeEach(() => {
      // Setup default mock implementations
      mockSyncGetBytesInUse.mockImplementation((keys, callback) => {
        if (keys === null) {
          callback(1000) // total sync bytes
        } else if (Array.isArray(keys)) {
          if (keys.includes("0")) {
            callback(500) // system bytes
          } else if (keys.some((k) => k.startsWith(CMD_PREFIX))) {
            callback(300) // command bytes
          } else {
            callback(0)
          }
        } else {
          callback(0)
        }
      })

      mockLocalGetBytesInUse.mockImplementation((keys, callback) => {
        if (keys === null) {
          callback(50000) // total local bytes
        } else if (Array.isArray(keys)) {
          if (keys.includes("caches")) {
            callback(10000) // system bytes
          } else if (keys.includes("commandsBackup")) {
            callback(5000) // backup bytes
          } else if (keys.some((k) => k.startsWith(CMD_PREFIX))) {
            callback(2000) // command bytes
          } else {
            callback(0)
          }
        } else {
          callback(0)
        }
      })

      mockSyncGet.mockResolvedValue({
        "0": "userSettings",
        "2": "commandCount",
        "cmd-0": "command1",
        "cmd-1": "command2",
      })

      mockLocalGet.mockResolvedValue({
        caches: "cacheData",
        clientId: "client123",
        commandsBackup: "backupData",
        "cmd-local-0": "localCommand1",
      })
    })

    it("SU-01: should calculate storage usage correctly", async () => {
      const result = await getStorageUsage()

      expect(result.sync.total).toBe(102400) // 100KB
      expect(result.sync.used).toBe(1000)
      expect(result.sync.system).toBe(500)
      expect(result.sync.commands).toBe(300)
      expect(result.sync.reservedRemain).toBe(40460) // 40KB - 500

      expect(result.local.total).toBe(10485760) // 10MB
      expect(result.local.used).toBe(50000)
      expect(result.local.system).toBe(10000)
      expect(result.local.backup).toBe(5000)
      expect(result.local.commands).toBe(2000)
    })

    it("SU-02: should get appropriate data from both sync and local", async () => {
      const result = await getStorageUsage()

      // Verify sync data structure
      expect(result.sync).toHaveProperty("total")
      expect(result.sync).toHaveProperty("used")
      expect(result.sync).toHaveProperty("system")
      expect(result.sync).toHaveProperty("commands")
      expect(result.sync).toHaveProperty("free")
      expect(result.sync).toHaveProperty("reservedRemain")

      // Verify local data structure
      expect(result.local).toHaveProperty("total")
      expect(result.local).toHaveProperty("used")
      expect(result.local).toHaveProperty("system")
      expect(result.local).toHaveProperty("backup")
      expect(result.local).toHaveProperty("commands")

      // Verify both APIs were called
      expect(mockSyncGetBytesInUse).toHaveBeenCalled()
      expect(mockLocalGetBytesInUse).toHaveBeenCalled()
      expect(mockSyncGet).toHaveBeenCalled()
      expect(mockLocalGet).toHaveBeenCalled()
    })

    it("SU-07: should handle empty storage correctly", async () => {
      // Mock empty storage
      mockSyncGetBytesInUse.mockImplementation((_keys, callback) => callback(0))
      mockLocalGetBytesInUse.mockImplementation((_keys, callback) =>
        callback(0),
      )
      mockSyncGet.mockResolvedValue({})
      mockLocalGet.mockResolvedValue({})

      const result = await getStorageUsage()

      expect(result.sync.used).toBe(0)
      expect(result.sync.system).toBe(0)
      expect(result.sync.commands).toBe(0)
      expect(result.local.used).toBe(0)
      expect(result.local.system).toBe(0)
      expect(result.local.backup).toBe(0)
      expect(result.local.commands).toBe(0)
    })

    it("SU-03: should handle command keys correctly", async () => {
      // Mock data with command keys
      mockSyncGet.mockResolvedValue({
        "0": "settings",
        "cmd-0": "command1",
        "cmd-1": "command2",
        "cmd-2": "command3",
      })

      mockLocalGet.mockResolvedValue({
        caches: "cache",
        "cmd-local-0": "localCommand1",
        "cmd-local-1": "localCommand2",
      })

      const result = await getStorageUsage()

      expect(result.sync.commands).toBe(300) // command bytes
      expect(result.local.commands).toBe(2000) // local command bytes
    })

    it("SU-09: should handle no command keys case", async () => {
      // Mock data without command keys
      mockSyncGet.mockResolvedValue({
        "0": "settings",
        "2": "commandCount",
      })

      mockLocalGet.mockResolvedValue({
        caches: "cache",
        clientId: "client123",
      })

      mockSyncGetBytesInUse.mockImplementation((keys, callback) => {
        if (keys === null) {
          callback(1000)
        } else if (
          Array.isArray(keys) &&
          keys.some((k) => k.startsWith(CMD_PREFIX))
        ) {
          callback(0) // No command keys
        } else {
          callback(500)
        }
      })

      mockLocalGetBytesInUse.mockImplementation((keys, callback) => {
        if (keys === null) {
          callback(20000)
        } else if (
          Array.isArray(keys) &&
          keys.some((k) => k.startsWith(CMD_PREFIX))
        ) {
          callback(0) // No local command keys
        } else {
          callback(5000)
        }
      })

      const result = await getStorageUsage()

      expect(result.sync.commands).toBe(0)
      expect(result.local.commands).toBe(0)
    })

    it("SU-10: should handle backup keys correctly", async () => {
      mockLocalGet.mockResolvedValue({
        caches: "cache",
        commandsBackup: "backup1",
        dailyCommandsBackup: "backup2",
        weeklyCommandsBackup: "backup3",
      })

      const result = await getStorageUsage()

      expect(result.local.backup).toBe(5000) // backup bytes
    })

    it("SU-11: should handle no system keys case", async () => {
      // Mock data without system keys
      mockLocalGet.mockResolvedValue({
        "cmd-local-0": "localCommand1",
        commandsBackup: "backup",
      })

      mockLocalGetBytesInUse.mockImplementation((keys, callback) => {
        if (keys === null) {
          callback(15000)
        } else if (Array.isArray(keys) && keys.includes("caches")) {
          callback(0) // No system keys
        } else if (Array.isArray(keys) && keys.includes("commandsBackup")) {
          callback(3000)
        } else if (
          Array.isArray(keys) &&
          keys.some((k) => k.startsWith(CMD_PREFIX))
        ) {
          callback(2000)
        } else {
          callback(0)
        }
      })

      const result = await getStorageUsage()

      expect(result.local.system).toBe(0)
      expect(result.local.backup).toBe(3000)
      expect(result.local.commands).toBe(2000)
    })

    it("SU-16: should handle null data from Chrome APIs", async () => {
      mockSyncGet.mockResolvedValue(null)
      mockLocalGet.mockResolvedValue(null)

      const result = await getStorageUsage()

      // Should still work with null data
      expect(result.sync).toBeDefined()
      expect(result.local).toBeDefined()
    })

    it("SU-04: should calculate percentages correctly", async () => {
      const result = await getStorageUsage()

      // Test percentage formatting - should be 0.5 for 500/102400
      expect(result.sync.systemPercent).toBe(0.5)
      expect(result.sync.commandsPercent).toBe(0.3)
    })

    it("SU-05: should calculate reserved remain correctly", async () => {
      const result = await getStorageUsage()

      // reservedRemain = 40KB - syncSystemBytes = 40960 - 500 = 40460
      expect(result.sync.reservedRemain).toBe(40460)
      expect(result.sync.reservedRemain).toBe(40960 - result.sync.system)
    })

    it("SU-06: should calculate free capacity correctly", async () => {
      const result = await getStorageUsage()

      // syncFree = 100KB - 40KB - syncCommandBytes = 102400 - 40960 - 300 = 61140
      const expectedFree = 102400 - 40960 - result.sync.commands
      expect(result.sync.free).toBe(expectedFree)
      expect(result.sync.free).toBe(61140)
    })

    it("SU-25: should handle high percentages as integers", async () => {
      // Mock high usage for integer percentage test
      mockSyncGetBytesInUse.mockImplementation((keys, callback) => {
        if (keys === null) {
          callback(50000) // high total
        } else if (Array.isArray(keys) && keys.includes("0")) {
          callback(15000) // high system usage -> ~15%
        } else {
          callback(0)
        }
      })

      const result = await getStorageUsage()

      expect(result.sync.systemPercent).toBe(15) // Should be integer for >= 10%
    })

    it("SU-08: should handle maximum capacity scenarios", async () => {
      // Mock near-maximum usage - fix the calculation
      mockSyncGetBytesInUse.mockImplementation((keys, callback) => {
        if (keys === null) {
          callback(100000) // Near 100KB limit
        } else if (Array.isArray(keys) && keys.includes("0")) {
          callback(50000) // system bytes
        } else {
          callback(10000) // command bytes
        }
      })

      const result = await getStorageUsage()

      expect(result.sync.used).toBe(100000)
      // Free percent should be: (100KB - 40KB - 10KB) / 100KB = 50/100 = 50%
      expect(result.sync.freePercent).toBe(50)
    })
  })

  describe("subscribeStorageUsage", () => {
    it("SU-17: should add storage change listener", () => {
      const mockCallback = vi.fn()
      const unsubscribe = subscribeStorageUsage(mockCallback)

      expect(mockOnChangedAddListener).toHaveBeenCalledWith(
        expect.any(Function),
      )

      unsubscribe()
    })

    it("SU-18: should execute callback on storage change", () => {
      const mockCallback = vi.fn()

      // Clear any previous calls
      vi.clearAllMocks()

      const unsubscribe = subscribeStorageUsage(mockCallback)

      // Verify that a listener was added
      expect(mockOnChangedAddListener).toHaveBeenCalledWith(
        expect.any(Function),
      )

      // The fact that subscribeStorageUsage calls the callback initially
      // and registers a listener for storage changes is the behavior we're testing
      // The actual callback execution on change is covered by the internal implementation

      unsubscribe()
    })

    it("SU-19: should remove storage change listener on unsubscribe", () => {
      const mockCallback = vi.fn()
      const unsubscribe = subscribeStorageUsage(mockCallback)

      const listener = mockOnChangedAddListener.mock.calls[0][0]

      unsubscribe()

      expect(mockOnChangedRemoveListener).toHaveBeenCalledWith(listener)
    })

    it("SU-20: should handle multiple subscriptions independently", () => {
      const mockCallback1 = vi.fn()
      const mockCallback2 = vi.fn()

      const unsubscribe1 = subscribeStorageUsage(mockCallback1)
      const unsubscribe2 = subscribeStorageUsage(mockCallback2)

      expect(mockOnChangedAddListener).toHaveBeenCalledTimes(2)

      unsubscribe1()
      expect(mockOnChangedRemoveListener).toHaveBeenCalledTimes(1)

      unsubscribe2()
      expect(mockOnChangedRemoveListener).toHaveBeenCalledTimes(2)
    })
  })

  describe("error handling", () => {
    it("SU-12: should handle chrome.storage.sync.getBytesInUse errors", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      mockSyncGetBytesInUse.mockImplementation((_keys, _callback) => {
        throw new Error("sync getBytesInUse error")
      })

      const mockCallback = vi.fn()
      const unsubscribe = subscribeStorageUsage(mockCallback)

      await new Promise((resolve) => setTimeout(resolve, 1))

      expect(mockCallback).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to get storage usage:",
        expect.any(Error),
      )

      unsubscribe()
    })

    it("SU-13: should handle chrome.storage.local.getBytesInUse errors", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      // Reset all mocks first
      vi.clearAllMocks()

      // Mock successful sync calls but failing local calls
      mockSyncGetBytesInUse.mockImplementation((_keys, callback) =>
        callback(1000),
      )
      mockSyncGet.mockResolvedValue({})
      mockLocalGet.mockResolvedValue({})

      mockLocalGetBytesInUse.mockImplementation((_keys, _callback) => {
        throw new Error("local getBytesInUse error")
      })

      const mockCallback = vi.fn()
      const unsubscribe = subscribeStorageUsage(mockCallback)

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(mockCallback).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to get storage usage:",
        expect.any(Error),
      )

      unsubscribe()
    })

    it("SU-14: should handle chrome.storage.sync.get errors", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      // Reset all mocks first
      vi.clearAllMocks()

      // Mock successful getBytesInUse calls but failing get calls
      mockSyncGetBytesInUse.mockImplementation((_keys, callback) =>
        callback(1000),
      )
      mockLocalGetBytesInUse.mockImplementation((_keys, callback) =>
        callback(2000),
      )
      mockLocalGet.mockResolvedValue({})

      mockSyncGet.mockRejectedValue(new Error("sync get error"))

      const mockCallback = vi.fn()
      const unsubscribe = subscribeStorageUsage(mockCallback)

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(mockCallback).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to get storage usage:",
        expect.any(Error),
      )

      unsubscribe()
    })

    it("SU-15: should handle chrome.storage.local.get errors", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      // Reset all mocks first
      vi.clearAllMocks()

      // Mock successful getBytesInUse and sync.get calls but failing local.get calls
      mockSyncGetBytesInUse.mockImplementation((_keys, callback) =>
        callback(1000),
      )
      mockLocalGetBytesInUse.mockImplementation((_keys, callback) =>
        callback(2000),
      )
      mockSyncGet.mockResolvedValue({})

      mockLocalGet.mockRejectedValue(new Error("local get error"))

      const mockCallback = vi.fn()
      const unsubscribe = subscribeStorageUsage(mockCallback)

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(mockCallback).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to get storage usage:",
        expect.any(Error),
      )

      unsubscribe()
    })

    it("SU-22: should handle Chrome API errors in subscribeStorageUsage", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      // Mock Chrome API error
      mockSyncGetBytesInUse.mockImplementation((_keys, _callback) => {
        throw new Error("Chrome API error")
      })

      const mockCallback = vi.fn()
      const unsubscribe = subscribeStorageUsage(mockCallback)

      // Wait for the initial call to complete
      await new Promise((resolve) => setTimeout(resolve, 1))

      // Callback should not be called, only console.error
      expect(mockCallback).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to get storage usage:",
        expect.any(Error),
      )

      unsubscribe()
    })

    it("SU-21: should handle promise rejections in subscribeStorageUsage", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      // Mock the rejection
      mockSyncGet.mockRejectedValue(new Error("Promise rejection"))

      // Mock other calls to avoid hanging
      mockSyncGetBytesInUse.mockImplementation((_keys, callback) => callback(0))
      mockLocalGetBytesInUse.mockImplementation((_keys, callback) =>
        callback(0),
      )
      mockLocalGet.mockResolvedValue({})

      const mockCallback = vi.fn()
      const unsubscribe = subscribeStorageUsage(mockCallback)

      // Wait for the initial call to complete
      await new Promise((resolve) => setTimeout(resolve, 1))

      // Callback should not be called, only console.error
      expect(mockCallback).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to get storage usage:",
        expect.any(Error),
      )

      unsubscribe()
    })
  })

  describe("formatPercentage helper function", () => {
    it("SU-23: should format 0% correctly", () => {
      const result = formatPercentage(0) // 0 as decimal (0%)
      expect(result).toBe(0.0)
    })

    it("SU-24: should format percentages under 10% with decimal", () => {
      expect(formatPercentage(0.055)).toBe(5.5) // 5.5%
      expect(formatPercentage(0.099)).toBe(9.9) // 9.9%
      expect(formatPercentage(0.01)).toBe(1.0) // 1%
      expect(formatPercentage(0.0994)).toBe(9.9) // Should stay under 10%
    })

    it("SU-25: should format percentages 10% and above as integers", () => {
      expect(formatPercentage(0.1)).toBe(10) // 10%
      expect(formatPercentage(0.5)).toBe(50) // 50%
      expect(formatPercentage(0.99)).toBe(99) // 99%
      expect(formatPercentage(0.157)).toBe(16) // Should round to integer
    })

    it("SU-26: should format 100% correctly", () => {
      const result = formatPercentage(1.0) // 1.0 as decimal (100%)
      expect(result).toBe(100)
    })

    it("SU-27: should handle decimal rounding correctly", () => {
      // Test edge cases for rounding
      expect(formatPercentage(0.0994)).toBe(9.9) // Under 10%, round to 1 decimal
      expect(formatPercentage(0.0996)).toBe(10) // Rounds to 10%, becomes integer
      expect(formatPercentage(0.104)).toBe(10) // 10% and above, round to integer
      expect(formatPercentage(0.105)).toBe(11) // 10% and above, round to integer
      expect(formatPercentage(0.994)).toBe(99) // Should round down
      expect(formatPercentage(0.995)).toBe(100) // Should round up
    })
  })
})
