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
import { getStorageUsage, subscribeStorageUsage } from "./storageUsage"

describe("storageUsage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.chrome.runtime.lastError = undefined
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

    it("should calculate storage usage correctly", async () => {
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

    it("should handle empty storage correctly", async () => {
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

    it("should handle command keys correctly", async () => {
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

    it("should handle backup keys correctly", async () => {
      mockLocalGet.mockResolvedValue({
        caches: "cache",
        commandsBackup: "backup1",
        dailyCommandsBackup: "backup2",
        weeklyCommandsBackup: "backup3",
      })

      const result = await getStorageUsage()

      expect(result.local.backup).toBe(5000) // backup bytes
    })

    it("should handle null data from Chrome APIs", async () => {
      mockSyncGet.mockResolvedValue(null)
      mockLocalGet.mockResolvedValue(null)

      const result = await getStorageUsage()

      // Should still work with null data
      expect(result.sync).toBeDefined()
      expect(result.local).toBeDefined()
    })

    it("should calculate percentages correctly", async () => {
      const result = await getStorageUsage()

      // Test percentage formatting - should be 0.5 for 500/102400
      expect(result.sync.systemPercent).toBe(0.5)
      expect(result.sync.commandsPercent).toBe(0.3)
    })

    it("should handle high percentages as integers", async () => {
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

    it("should handle maximum capacity scenarios", async () => {
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
    it("should add storage change listener", () => {
      const mockCallback = vi.fn()
      const unsubscribe = subscribeStorageUsage(mockCallback)

      expect(mockOnChangedAddListener).toHaveBeenCalledWith(
        expect.any(Function),
      )

      unsubscribe()
    })

    it("should remove storage change listener on unsubscribe", () => {
      const mockCallback = vi.fn()
      const unsubscribe = subscribeStorageUsage(mockCallback)

      const listener = mockOnChangedAddListener.mock.calls[0][0]

      unsubscribe()

      expect(mockOnChangedRemoveListener).toHaveBeenCalledWith(listener)
    })

    it("should handle multiple subscriptions independently", () => {
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

    it("should handle errors in getStorageUsage gracefully", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      // Mock Chrome API error
      mockSyncGetBytesInUse.mockImplementation((_keys, _callback) => {
        throw new Error("Chrome API error")
      })

      const mockCallback = vi.fn()
      const unsubscribe = subscribeStorageUsage(mockCallback)

      // Wait for the initial call to complete
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Should not throw, but should log error
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to get storage usage:",
        expect.any(Error),
      )

      unsubscribe()
      consoleSpy.mockRestore()
    })
  })

  describe("error handling", () => {
    it("should handle Chrome API errors", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      // Mock Chrome API error
      mockSyncGetBytesInUse.mockImplementation((_keys, _callback) => {
        throw new Error("Chrome API error")
      })

      await expect(getStorageUsage()).rejects.toThrow("Chrome API error")

      consoleSpy.mockRestore()
    })

    it("should handle promise rejections", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      // Reset all mocks for this test
      mockSyncGetBytesInUse.mockReset()
      mockLocalGetBytesInUse.mockReset()
      mockSyncGet.mockReset()
      mockLocalGet.mockReset()

      // Mock the rejection
      mockSyncGet.mockRejectedValue(new Error("Promise rejection"))

      // Mock other calls to avoid hanging
      mockSyncGetBytesInUse.mockImplementation((_keys, callback) => callback(0))
      mockLocalGetBytesInUse.mockImplementation((_keys, callback) =>
        callback(0),
      )
      mockLocalGet.mockResolvedValue({})

      await expect(getStorageUsage()).rejects.toThrow("Promise rejection")

      consoleSpy.mockRestore()
    })
  })
})
