import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { EnhancedSettings } from "./enhancedSettings"
import { OPEN_MODE } from "@/const"
import { setupStorageMocks } from "@/test/setup"
import { STORAGE_KEY, LOCAL_STORAGE_KEY } from "@/services/storage/const"
import { cmdSyncKey } from "../storage/index"
import type { Command } from "@/types"
import type { CommandMetadata, GlobalCommandMetadata } from "@/types/command"

const createCommand = (id: string): Command => {
  return {
    id,
    title: `Command ${id}`,
    iconUrl: "icon.png",
    searchUrl: "https://example.com?q=%s",
    openMode: OPEN_MODE.POPUP,
  }
}

describe("EnhancedSettings Performance Tests", () => {
  let enhancedSettings: EnhancedSettings
  let storageMockFactory: ReturnType<typeof setupStorageMocks>

  beforeEach(() => {
    vi.clearAllMocks()
    enhancedSettings = new EnhancedSettings()

    // Setup realistic storage mocks
    storageMockFactory = setupStorageMocks("realistic")

    const syncCommands = [createCommand("sync1"), createCommand("sync2")]

    // Set up sync storage
    const scm: CommandMetadata = {
      count: syncCommands.length,
      version: 123456,
    }
    storageMockFactory.setStorageData(STORAGE_KEY.SYNC_COMMAND_METADATA, scm)
    syncCommands.forEach((cmd, idx) => {
      storageMockFactory.setStorageData(cmdSyncKey(idx), cmd)
    })

    // Set up global metadata with mixed order
    const globalOrder = ["sync1", "sync2"]
    const gcm: GlobalCommandMetadata = {
      globalOrder,
      version: 123456,
      lastUpdated: Date.now(),
    }
    storageMockFactory.setStorageData(
      LOCAL_STORAGE_KEY.GLOBAL_COMMAND_METADATA,
      gcm,
    )

    // Setup initial storage data
    storageMockFactory.setStorageData(STORAGE_KEY.USER, {
      settingVersion: "1.0.0",
      folders: [],
      pageRules: [],
      commands: [],
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
    // Clean up storage and restore mock for other tests
    storageMockFactory.reset()
  })

  it("MG-PERF-01: should measure initial data fetch time", async () => {
    const startTime = performance.now()
    await enhancedSettings.get({ forceFresh: true })
    const duration = performance.now() - startTime

    // This test should now measure real performance with realistic storage
    console.debug("Initial fetch duration:", duration)
    expect(duration).toBeLessThan(100)
  })

  it("MG-PERF-02: should measure cache effectiveness", async () => {
    // Clear cache to ensure fresh start
    enhancedSettings.invalidateAllCache()

    // Initial fetch (no cache)
    const start1 = performance.now()
    await enhancedSettings.get({ forceFresh: true })
    const duration1 = performance.now() - start1
    console.debug("Initial fetch duration:", duration1)

    // Second fetch (from cache)
    const start2 = performance.now()
    await enhancedSettings.get()
    const duration2 = performance.now() - start2
    console.debug("Cache fetch duration:", duration2)

    // With real cache, 2nd call should be faster than initial fetch
    expect(duration2).toBeLessThan(duration1 * 0.5)
  })
})
