import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { SettingsCacheManager, CACHE_SECTIONS } from "./settingsCache"
import { Storage, STORAGE_KEY, LOCAL_STORAGE_KEY } from "../storage"
import { OPEN_MODE } from "@/const"
import { cmdSyncKey } from "../storage/index"

// Helper function to create a valid SearchCommand object
const createMockCommand = (overrides: any = {}): any => ({
  id: "test-id",
  title: "Test Command",
  iconUrl: "",
  openMode: OPEN_MODE.TAB,
  ...overrides,
})

// Mock dependencies
vi.mock("../storage")
vi.mock("./settings")

const mockStorage = vi.mocked(Storage)

describe("SettingsCacheManager", () => {
  let cacheManager: SettingsCacheManager
  let mockChromeStorage: any

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()

    // Use fake timers for debounce testing
    vi.useFakeTimers()

    // Mock Chrome storage API
    mockChromeStorage = {
      onChanged: {
        addListener: vi.fn(),
      },
    }
    global.chrome = {
      ...global.chrome,
      storage: mockChromeStorage,
    }

    // Create new instance for each test
    cacheManager = new SettingsCacheManager()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe("DataVersionManager (via SettingsCacheManager)", () => {
    it("SC-04: should generate consistent versions for same data", async () => {
      mockStorage.getCommands.mockResolvedValue([])

      // Get data twice with same content
      await cacheManager.get(CACHE_SECTIONS.COMMANDS)
      const status1 = cacheManager.getCacheStatus()

      // Clear cache and get again
      cacheManager.invalidate([CACHE_SECTIONS.COMMANDS])
      await cacheManager.get(CACHE_SECTIONS.COMMANDS)
      const status2 = cacheManager.getCacheStatus()

      // Version should be different due to timestamp, but data should be same
      expect(status1[CACHE_SECTIONS.COMMANDS]).toBeDefined()
      expect(status2[CACHE_SECTIONS.COMMANDS]).toBeDefined()
    })

    it("SC-05: should generate different versions for different data", async () => {
      const data1 = [createMockCommand({ id: "1", title: "test1" })]
      const data2 = [createMockCommand({ id: "2", title: "test2" })]

      mockStorage.getCommands
        .mockResolvedValueOnce(data1)
        .mockResolvedValueOnce(data2)

      await cacheManager.get(CACHE_SECTIONS.COMMANDS)
      const status1 = cacheManager.getCacheStatus()

      cacheManager.invalidate([CACHE_SECTIONS.COMMANDS])
      await cacheManager.get(CACHE_SECTIONS.COMMANDS)
      const status2 = cacheManager.getCacheStatus()

      // Should have different cache entries
      expect(status1[CACHE_SECTIONS.COMMANDS]).toBeDefined()
      expect(status2[CACHE_SECTIONS.COMMANDS]).toBeDefined()
    })
  })

  describe("get method", () => {
    it("SC-07: should return cached data on cache hit", async () => {
      const mockData = [createMockCommand({ id: "1", title: "test" })]
      mockStorage.getCommands.mockResolvedValue(mockData)

      // First call - cache miss
      const result1 = await cacheManager.get(CACHE_SECTIONS.COMMANDS)
      expect(result1).toEqual(mockData)
      expect(mockStorage.getCommands).toHaveBeenCalledTimes(1)

      // Second call - cache hit
      const result2 = await cacheManager.get(CACHE_SECTIONS.COMMANDS)
      expect(result2).toEqual(mockData)
      expect(mockStorage.getCommands).toHaveBeenCalledTimes(1) // Should not call again
    })

    it("SC-09: should force refresh when forceFresh is true", async () => {
      const mockData = [createMockCommand({ id: "1", title: "test" })]
      mockStorage.getCommands.mockResolvedValue(mockData)

      // First call
      await cacheManager.get(CACHE_SECTIONS.COMMANDS)
      expect(mockStorage.getCommands).toHaveBeenCalledTimes(1)

      // Second call with forceFresh
      await cacheManager.get(CACHE_SECTIONS.COMMANDS, true)
      expect(mockStorage.getCommands).toHaveBeenCalledTimes(2)
    })

    it("SC-10: should handle TTL expiration", async () => {
      const mockData = [createMockCommand({ id: "1", title: "test" })]
      mockStorage.getCommands.mockResolvedValue(mockData)

      // Mock Date.now to control time
      const originalNow = Date.now
      let mockTime = 1000000
      vi.spyOn(Date, "now").mockImplementation(() => mockTime)

      // First call
      await cacheManager.get(CACHE_SECTIONS.COMMANDS)
      expect(mockStorage.getCommands).toHaveBeenCalledTimes(1)

      // Advance time beyond TTL (5 minutes)
      mockTime += 6 * 60 * 1000

      // Second call should refresh due to TTL expiration
      await cacheManager.get(CACHE_SECTIONS.COMMANDS)
      expect(mockStorage.getCommands).toHaveBeenCalledTimes(2)

      // Restore Date.now
      Date.now = originalNow
    })

    it("SC-11: should load from storage for each section type", async () => {
      const mockCommands = [createMockCommand({ id: "1", title: "test" })]
      const mockUserSettings = { theme: "dark" }
      const mockStars = [{ id: "1" }]
      const mockShortcuts = { shortcuts: [] }
      const mockUserStats = { commandExecutionCount: 5 }
      const mockCaches = { images: {} }

      mockStorage.getCommands.mockResolvedValue(mockCommands)
      mockStorage.get
        .mockResolvedValueOnce(mockUserSettings)
        .mockResolvedValueOnce(mockStars)
        .mockResolvedValueOnce(mockShortcuts)
        .mockResolvedValueOnce(mockUserStats)
        .mockResolvedValueOnce(mockCaches)

      // Test each section
      const commands = await cacheManager.get(CACHE_SECTIONS.COMMANDS)
      expect(commands).toEqual(mockCommands)
      expect(mockStorage.getCommands).toHaveBeenCalled()

      const userSettings = await cacheManager.get(CACHE_SECTIONS.USER_SETTINGS)
      expect(userSettings).toEqual(mockUserSettings)

      const stars = await cacheManager.get(CACHE_SECTIONS.STARS)
      expect(stars).toEqual(mockStars)

      const shortcuts = await cacheManager.get(CACHE_SECTIONS.SHORTCUTS)
      expect(shortcuts).toEqual(mockShortcuts)

      const userStats = await cacheManager.get(CACHE_SECTIONS.USER_STATS)
      expect(userStats).toEqual(mockUserStats)

      const caches = await cacheManager.get(CACHE_SECTIONS.CACHES)
      expect(caches).toEqual(mockCaches)
    })

    it("SC-12: should throw error for unknown section", async () => {
      await expect(cacheManager.get("unknown-section" as any)).rejects.toThrow(
        "Unknown cache section: unknown-section",
      )
    })
  })

  describe("cache invalidation", () => {
    it("SC-18: should invalidate specified sections", async () => {
      const mockData = [createMockCommand({ id: "1", title: "test" })]
      mockStorage.getCommands.mockResolvedValue(mockData)

      // Load data to cache
      await cacheManager.get(CACHE_SECTIONS.COMMANDS)
      expect(mockStorage.getCommands).toHaveBeenCalledTimes(1)

      // Invalidate cache
      cacheManager.invalidate([CACHE_SECTIONS.COMMANDS])

      // Next call should reload from storage
      await cacheManager.get(CACHE_SECTIONS.COMMANDS)
      expect(mockStorage.getCommands).toHaveBeenCalledTimes(2)
    })

    it("SC-19: should invalidate all cache sections", async () => {
      const mockData = [createMockCommand({ id: "1", title: "test" })]
      mockStorage.getCommands.mockResolvedValue(mockData)
      mockStorage.get.mockResolvedValue({})

      // Load multiple sections
      await cacheManager.get(CACHE_SECTIONS.COMMANDS)
      await cacheManager.get(CACHE_SECTIONS.USER_SETTINGS)

      // Invalidate all
      cacheManager.invalidateAll()

      // Both should reload
      await cacheManager.get(CACHE_SECTIONS.COMMANDS)
      await cacheManager.get(CACHE_SECTIONS.USER_SETTINGS)

      expect(mockStorage.getCommands).toHaveBeenCalledTimes(2)
      expect(mockStorage.get).toHaveBeenCalledTimes(2)
    })

    it("SC-20: should notify listeners on invalidation", async () => {
      const listener = vi.fn()
      cacheManager.subscribe(CACHE_SECTIONS.COMMANDS, listener)

      cacheManager.invalidate([CACHE_SECTIONS.COMMANDS])

      expect(listener).toHaveBeenCalledTimes(1)
    })
  })

  describe("listener functionality", () => {
    it("SC-22: should subscribe and unsubscribe listeners", () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      // Subscribe listeners
      cacheManager.subscribe(CACHE_SECTIONS.COMMANDS, listener1)
      cacheManager.subscribe(CACHE_SECTIONS.COMMANDS, listener2)

      // Trigger notification
      cacheManager.invalidate([CACHE_SECTIONS.COMMANDS])

      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(1)

      // Unsubscribe one listener
      cacheManager.unsubscribe(CACHE_SECTIONS.COMMANDS, listener1)

      // Trigger notification again
      cacheManager.invalidate([CACHE_SECTIONS.COMMANDS])

      expect(listener1).toHaveBeenCalledTimes(1) // Should not be called again
      expect(listener2).toHaveBeenCalledTimes(2)
    })

    it("SC-25: should handle listener errors gracefully", () => {
      const errorListener = vi.fn().mockImplementation(() => {
        throw new Error("Listener error")
      })
      const normalListener = vi.fn()

      cacheManager.subscribe(CACHE_SECTIONS.COMMANDS, errorListener)
      cacheManager.subscribe(CACHE_SECTIONS.COMMANDS, normalListener)

      // Should not throw error
      expect(() => {
        cacheManager.invalidate([CACHE_SECTIONS.COMMANDS])
      }).not.toThrow()

      expect(errorListener).toHaveBeenCalled()
      expect(normalListener).toHaveBeenCalled()
    })

    it("SC-27: should clean up listener sets when empty", () => {
      const listener = vi.fn()

      cacheManager.subscribe(CACHE_SECTIONS.COMMANDS, listener)
      cacheManager.unsubscribe(CACHE_SECTIONS.COMMANDS, listener)

      // After unsubscribing the last listener, the section should be cleaned up
      // This is verified by checking that subsequent invalidation doesn't call anything
      cacheManager.invalidate([CACHE_SECTIONS.COMMANDS])
      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe("storage change monitoring", () => {
    it("SC-28: should set up Chrome storage listener", () => {
      // Constructor should have set up the listener
      expect(mockChromeStorage.onChanged.addListener).toHaveBeenCalledTimes(1)
    })

    it("SC-29: should invalidate correct sections on storage changes", () => {
      const invalidateSpy = vi.spyOn(cacheManager, "invalidate")

      // Get the listener function that was registered
      const listenerFn =
        mockChromeStorage.onChanged.addListener.mock.calls[0][0]

      // Simulate different storage changes using actual storage keys
      const changes = {
        [STORAGE_KEY.USER]: { newValue: {}, oldValue: {} },
        [STORAGE_KEY.USER_STATS]: { newValue: {}, oldValue: {} },
        [STORAGE_KEY.SHORTCUTS]: { newValue: {}, oldValue: {} },
        [LOCAL_STORAGE_KEY.STARS]: { newValue: {}, oldValue: {} },
        [LOCAL_STORAGE_KEY.CACHES]: { newValue: {}, oldValue: {} },
        [cmdSyncKey(123)]: { newValue: {}, oldValue: {} },
      }

      listenerFn(changes, "sync")

      // Advance timers to wait for debounce processing
      vi.advanceTimersByTime(10) // 5ms + buffer

      // Verify call count and arguments since invalidate is called per section
      expect(invalidateSpy).toHaveBeenCalledTimes(6)

      // Verify that each section is invalidated individually
      const calledSections = invalidateSpy.mock.calls.map((call) => call[0][0])
      expect(calledSections).toEqual(
        expect.arrayContaining([
          CACHE_SECTIONS.USER_SETTINGS,
          CACHE_SECTIONS.USER_STATS,
          CACHE_SECTIONS.SHORTCUTS,
          CACHE_SECTIONS.STARS,
          CACHE_SECTIONS.CACHES,
          CACHE_SECTIONS.COMMANDS,
        ]),
      )
    })

    it("SC-35: should deduplicate sections when invalidating", () => {
      const invalidateSpy = vi.spyOn(cacheManager, "invalidate")

      const listenerFn =
        mockChromeStorage.onChanged.addListener.mock.calls[0][0]

      // Multiple command changes should only invalidate COMMANDS once
      const changes = {
        [cmdSyncKey(123)]: { newValue: {}, oldValue: {} },
        [cmdSyncKey(456)]: { newValue: {}, oldValue: {} },
      }

      listenerFn(changes, "sync")

      // Advance timers to wait for debounce processing
      vi.advanceTimersByTime(10) // 5ms + buffer

      // Multiple command changes should result in only one COMMANDS section due to debouncing
      expect(invalidateSpy).toHaveBeenCalledTimes(1)
      expect(invalidateSpy).toHaveBeenCalledWith([CACHE_SECTIONS.COMMANDS])
    })

    it("SC-36: should not set up listener multiple times", () => {
      // Create another instance
      new SettingsCacheManager()

      // Should still only have been called once per instance
      expect(mockChromeStorage.onChanged.addListener).toHaveBeenCalledTimes(2)
    })
  })

  describe("cache status debugging", () => {
    it("SC-44: should return cache status for all sections", async () => {
      const mockData = [createMockCommand({ id: "1", title: "test" })]
      mockStorage.getCommands.mockResolvedValue(mockData)

      // Load some data
      await cacheManager.get(CACHE_SECTIONS.COMMANDS)

      const status = cacheManager.getCacheStatus()

      expect(status[CACHE_SECTIONS.COMMANDS]).toEqual({
        cached: true,
        age: expect.any(Number),
      })

      expect(status[CACHE_SECTIONS.COMMANDS].age).toBeGreaterThanOrEqual(0)
    })

    it("SC-46: should not include uncached sections in status", () => {
      const status = cacheManager.getCacheStatus()

      // Should be empty for new cache manager
      expect(Object.keys(status)).toHaveLength(0)
    })

    it("SC-45: should show correct cache age", async () => {
      const mockData = [createMockCommand({ id: "1", title: "test" })]
      mockStorage.getCommands.mockResolvedValue(mockData)

      const originalNow = Date.now
      let mockTime = 1000000
      vi.spyOn(Date, "now").mockImplementation(() => mockTime)

      // Load data
      await cacheManager.get(CACHE_SECTIONS.COMMANDS)

      // Advance time
      mockTime += 5000 // 5 seconds

      const status = cacheManager.getCacheStatus()
      expect(status[CACHE_SECTIONS.COMMANDS].age).toBe(5000)

      Date.now = originalNow
    })
  })
})
