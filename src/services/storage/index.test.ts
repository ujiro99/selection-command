import { beforeEach, afterEach, describe, it, expect, vi } from "vitest"

// Mock Chrome API
const mockChromeStorageSync = {
  set: vi.fn().mockImplementation((_data, callback) => {
    callback?.()
  }),
}

const mockChromeRuntime = {
  lastError: undefined as chrome.runtime.LastError | undefined,
}

// Mock Chrome API
vi.stubGlobal("chrome", {
  storage: {
    sync: mockChromeStorageSync,
  },
  runtime: mockChromeRuntime,
})

// Import module after mocking
import { debouncedSyncSet } from "./index"

describe("debouncedSyncSet", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    mockChromeRuntime.lastError = undefined
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("Basic debounce behavior", () => {
    it("DS-01: Normal operation with single call", async () => {
      const testData = { key1: "value1" }
      const promise = debouncedSyncSet(testData)

      // Advance timer to execute processing
      vi.advanceTimersByTime(10)
      await promise

      expect(mockChromeStorageSync.set).toHaveBeenCalledTimes(1)
      expect(mockChromeStorageSync.set).toHaveBeenCalledWith(
        testData,
        expect.any(Function),
      )
    })

    it("DS-02: Debounce with multiple consecutive calls", async () => {
      const promise1 = debouncedSyncSet({ key1: "value1" })
      const promise2 = debouncedSyncSet({ key2: "value2" })
      const promise3 = debouncedSyncSet({ key3: "value3" })

      // Advance timer to execute processing
      vi.advanceTimersByTime(10)
      await Promise.all([promise1, promise2, promise3])

      // Verify it's called only once
      expect(mockChromeStorageSync.set).toHaveBeenCalledTimes(1)
      expect(mockChromeStorageSync.set).toHaveBeenCalledWith(
        { key1: "value1", key2: "value2", key3: "value3" },
        expect.any(Function),
      )
    })

    it("DS-03: Data merge operation", async () => {
      // Merge different keys
      const promise1 = debouncedSyncSet({ key1: "value1" })
      const promise2 = debouncedSyncSet({ key2: "value2" })

      // Overwrite same key
      const promise3 = debouncedSyncSet({ key1: "updated_value1" })

      vi.advanceTimersByTime(10)
      await Promise.all([promise1, promise2, promise3])

      expect(mockChromeStorageSync.set).toHaveBeenCalledWith(
        { key1: "updated_value1", key2: "value2" },
        expect.any(Function),
      )
    })
  })

  describe("Promise resolution and error handling", () => {
    it("DS-04: Resolve all Promises on success", async () => {
      const promise1 = debouncedSyncSet({ key1: "value1" })
      const promise2 = debouncedSyncSet({ key2: "value2" })
      const promise3 = debouncedSyncSet({ key3: "value3" })

      vi.advanceTimersByTime(10)

      // Verify all Promises are resolved
      await expect(
        Promise.all([promise1, promise2, promise3]),
      ).resolves.toEqual([undefined, undefined, undefined])
    })

    it("DS-05: Error handling", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      // Set Chrome runtime error
      mockChromeRuntime.lastError = { message: "Storage error" }

      const promise = debouncedSyncSet({ key1: "value1" })
      vi.advanceTimersByTime(10)

      // Promise should resolve even when error occurs
      await expect(promise).resolves.toBeUndefined()

      // Verify error is logged to console
      expect(consoleSpy).toHaveBeenCalledWith({ message: "Storage error" })

      consoleSpy.mockRestore()
    })
  })

  describe("Concurrent processing and state management", () => {
    it("DS-06: Handle concurrent calls", async () => {
      // Execute multiple calls concurrently
      const promise1 = debouncedSyncSet({ key1: "value1" })
      const promise2 = debouncedSyncSet({ key2: "value2" })
      const promise3 = debouncedSyncSet({ key3: "value3" })

      vi.advanceTimersByTime(10)

      const promises = await Promise.all([promise1, promise2, promise3])

      // Verify all Promises resolve successfully
      expect(promises).toEqual([undefined, undefined, undefined])
      expect(mockChromeStorageSync.set).toHaveBeenCalledTimes(1)
      expect(mockChromeStorageSync.set).toHaveBeenCalledWith(
        { key1: "value1", key2: "value2", key3: "value3" },
        expect.any(Function),
      )
    })

    it("DS-07: Internal state cleanup", async () => {
      const promise = debouncedSyncSet({ key1: "value1" })

      vi.advanceTimersByTime(10)
      await promise

      // Verify new calls work correctly (internal state is cleared)
      const promise2 = debouncedSyncSet({ key2: "value2" })
      vi.advanceTimersByTime(10)
      await promise2

      expect(mockChromeStorageSync.set).toHaveBeenCalledTimes(2)
      expect(mockChromeStorageSync.set).toHaveBeenNthCalledWith(
        2,
        { key2: "value2" },
        expect.any(Function),
      )
    })
  })

  describe("Edge cases", () => {
    it("DS-08: Handle empty object", async () => {
      const promise = debouncedSyncSet({})

      vi.advanceTimersByTime(10)
      await promise

      expect(mockChromeStorageSync.set).toHaveBeenCalledWith(
        {},
        expect.any(Function),
      )
    })

    it("DS-09: Additional calls during timeout", async () => {
      const promise1 = debouncedSyncSet({ key1: "value1" })

      // Additional call after 5ms (before timeout completion)
      vi.advanceTimersByTime(5)
      const promise2 = debouncedSyncSet({ key2: "value2" })

      // Advance another 10ms to complete processing
      vi.advanceTimersByTime(10)
      await Promise.all([promise1, promise2])

      // Verify called only once and both data are merged
      expect(mockChromeStorageSync.set).toHaveBeenCalledTimes(1)
      expect(mockChromeStorageSync.set).toHaveBeenCalledWith(
        { key1: "value1", key2: "value2" },
        expect.any(Function),
      )
    })
  })
})
