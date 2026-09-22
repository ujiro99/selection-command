import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  BACKUP_TYPES,
  BACKUP_STATUS,
  INITIAL_BACKUP_STATUS,
  getTimestamp,
  resetSettings,
  buildExportData,
  exportSettings,
  readSettingsFile,
  importSettings,
  checkBackupStatus,
  getDefaultBackupType,
  isCheckingBackups,
  hasAvailableBackup,
  getAvailableBackups,
  restoreFromBackup,
} from "./importExport"
import type { BackupStatusMap, BackupEntry } from "./importExport"
import { Storage, STORAGE_KEY, LOCAL_STORAGE_KEY } from "@/services/storage"
import { Settings, migrate } from "@/services/settings/settings"
import { enhancedSettings } from "@/services/settings/enhancedSettings"
import { CACHE_SECTIONS } from "@/services/settings/settingsCache"
import { APP_ID } from "@/const"

const backupMocks = vi.hoisted(() => ({
  legacy: { getLastBackupData: vi.fn(), restoreFromBackup: vi.fn() },
  daily: { getLastBackupData: vi.fn(), restoreFromBackup: vi.fn() },
  weekly: { getLastBackupData: vi.fn(), restoreFromBackup: vi.fn() },
}))

vi.mock("@/services/storage/backupManager", () => ({
  LegacyBackupManager: vi.fn(() => backupMocks.legacy),
  DailyBackupManager: vi.fn(() => backupMocks.daily),
  WeeklyBackupManager: vi.fn(() => backupMocks.weekly),
}))

vi.mock("@/services/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/storage")>()
  return {
    ...actual,
    Storage: {
      get: vi.fn(),
      getCommands: vi.fn(),
      setCommands: vi.fn(),
    },
  }
})

vi.mock("@/services/settings/settings", () => ({
  Settings: { reset: vi.fn(), set: vi.fn() },
  migrate: vi.fn(),
}))

vi.mock("@/services/settings/enhancedSettings", () => ({
  enhancedSettings: { get: vi.fn(), getSection: vi.fn() },
}))

const mockStorage = vi.mocked(Storage)
const mockSettings = vi.mocked(Settings)
const mockMigrate = vi.mocked(migrate)
const mockEnhancedSettings = vi.mocked(enhancedSettings)

const entry = (
  status: BackupEntry["status"],
  info: BackupEntry["info"] = null,
): BackupEntry => ({ status, info })

const statusMap = (
  legacy: BackupEntry["status"],
  daily: BackupEntry["status"],
  weekly: BackupEntry["status"],
): BackupStatusMap => ({
  [BACKUP_TYPES.LEGACY]: entry(legacy),
  [BACKUP_TYPES.DAILY]: entry(daily),
  [BACKUP_TYPES.WEEKLY]: entry(weekly),
})

const { AVAILABLE, NONE, CHECKING } = BACKUP_STATUS

describe("importExport", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("INITIAL_BACKUP_STATUS", () => {
    it("IE-01: should be CHECKING for all backup types", () => {
      expect(INITIAL_BACKUP_STATUS).toEqual(
        statusMap(CHECKING, CHECKING, CHECKING),
      )
    })
  })

  describe("getTimestamp", () => {
    it("IE-02: should format date as YYYYMMDD_HHmm with zero padding", () => {
      expect(getTimestamp(new Date(2024, 0, 5, 3, 7))).toBe("20240105_0307")
    })

    it("IE-03: should format two-digit values as is", () => {
      expect(getTimestamp(new Date(2024, 11, 31, 23, 59))).toBe("20241231_2359")
    })
  })

  describe("resetSettings", () => {
    it("IE-04: should call Settings.reset", async () => {
      mockSettings.reset.mockResolvedValue(undefined as any)
      await resetSettings()
      expect(mockSettings.reset).toHaveBeenCalledTimes(1)
    })
  })

  describe("buildExportData", () => {
    const setup = (commands: any[], caches: any) => {
      mockStorage.get.mockImplementation(async (key: any) => {
        if (key === STORAGE_KEY.USER) return { folders: [] }
        if (key === STORAGE_KEY.SHORTCUTS) return { shortcuts: [] }
        return undefined
      })
      mockStorage.getCommands.mockResolvedValue(commands)
      mockEnhancedSettings.getSection.mockResolvedValue(caches)
    }

    it("IE-05: should merge user settings, commands and shortcuts", async () => {
      const commands = [{ id: "1", iconUrl: "" }]
      setup(commands, { images: {} })

      const data = await buildExportData()

      expect(data).toEqual({
        folders: [],
        commands,
        shortcuts: { shortcuts: [] },
      })
      expect(mockEnhancedSettings.getSection).toHaveBeenCalledWith(
        CACHE_SECTIONS.CACHES,
        true,
      )
    })

    it("IE-06: should replace cache key iconUrl with cached data url", async () => {
      setup([{ id: "1", iconUrl: "cache-key" }], {
        images: { "cache-key": "data:image/png;base64,xxx" },
      })

      const data = await buildExportData()

      expect(data.commands[0].iconUrl).toBe("data:image/png;base64,xxx")
    })

    it("IE-07: should keep base64 / url / uncached iconUrl as is", async () => {
      setup(
        [
          { id: "1", iconUrl: "data:image/png;base64,aaa" },
          { id: "2", iconUrl: "https://example.com/icon.png" },
          { id: "3", iconUrl: "unknown-key" },
          { id: "4" },
        ],
        {
          images: {
            "data:image/png;base64,aaa": "replaced",
            "https://example.com/icon.png": "replaced",
          },
        },
      )

      const data = await buildExportData()

      expect(data.commands.map((c) => c.iconUrl)).toEqual([
        "data:image/png;base64,aaa",
        "https://example.com/icon.png",
        "unknown-key",
        undefined,
      ])
    })

    it("IE-08: should not throw when caches is undefined", async () => {
      setup([{ id: "1", iconUrl: "cache-key" }], undefined)

      const data = await buildExportData()

      expect(data.commands[0].iconUrl).toBe("cache-key")
    })
  })

  describe("exportSettings", () => {
    let createObjectURL: ReturnType<typeof vi.fn>
    let revokeObjectURL: ReturnType<typeof vi.fn>
    let clickSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["Date"] })
      vi.setSystemTime(new Date(2024, 0, 5, 3, 7))
      createObjectURL = vi.fn(() => "blob:mock")
      revokeObjectURL = vi.fn()
      URL.createObjectURL = createObjectURL as any
      URL.revokeObjectURL = revokeObjectURL as any
      clickSpy = vi
        .spyOn(HTMLAnchorElement.prototype, "click")
        .mockImplementation(() => {})

      mockStorage.get.mockImplementation(async (key: any) =>
        key === STORAGE_KEY.USER ? { folders: [] } : { shortcuts: [] },
      )
      mockStorage.getCommands.mockResolvedValue([])
      mockEnhancedSettings.getSection.mockResolvedValue({ images: {} })
    })

    afterEach(() => {
      vi.useRealTimers()
      clickSpy.mockRestore()
    })

    it("IE-09: should download a json file of export data", async () => {
      await exportSettings()

      expect(clickSpy).toHaveBeenCalledTimes(1)
      const clicked = clickSpy.mock.contexts[0] as HTMLAnchorElement
      expect(clicked.download).toBe(`${APP_ID}_20240105_0307.json`)
      expect(clicked.href).toBe("blob:mock")

      const blob = createObjectURL.mock.calls[0][0] as Blob
      // jsdom's Blob does not implement text(), so read it via FileReader.
      const text = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsText(blob)
      })
      expect(JSON.parse(text)).toEqual({
        folders: [],
        commands: [],
        shortcuts: { shortcuts: [] },
      })
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock")
    })

    it("IE-10: should remove the anchor element after download", async () => {
      await exportSettings()
      expect(document.querySelectorAll("a").length).toBe(0)
    })
  })

  describe("readSettingsFile", () => {
    it("IE-11: should parse json file content", async () => {
      const json = { folders: [], commands: [{ id: "1" }] }
      const file = new File([JSON.stringify(json)], "settings.json", {
        type: "application/json",
      })

      await expect(readSettingsFile(file)).resolves.toEqual(json)
    })

    it("IE-12: should reject when file content is invalid json", async () => {
      const file = new File(["{ invalid"], "settings.json")

      await expect(readSettingsFile(file)).rejects.toBeInstanceOf(SyntaxError)
    })

    it("IE-13: should reject when FileReader fails", async () => {
      const error = new Error("read error")
      const readSpy = vi
        .spyOn(FileReader.prototype, "readAsText")
        .mockImplementation(function (this: FileReader) {
          Object.defineProperty(this, "error", { value: error })
          this.onerror?.(new ProgressEvent("error") as any)
        })

      await expect(readSettingsFile(new File([""], "a.json"))).rejects.toBe(
        error,
      )
      readSpy.mockRestore()
    })
  })

  describe("importSettings", () => {
    beforeEach(() => {
      mockMigrate.mockImplementation(async (data: any) => ({
        ...data,
        migrated: true,
      }))
      mockSettings.set.mockResolvedValue(true as any)
    })

    it("IE-14: should keep local-only states and reset stars", async () => {
      mockEnhancedSettings.get.mockResolvedValue({
        commandExecutionCount: 10,
        hasShownReviewRequest: true,
        hasDismissedPromptHistoryBanner: true,
        hasShownHubShareToast: true,
        hasShownOnboarding: true,
      } as any)
      const importJson = {
        folders: [{ id: "f1" }],
        commandExecutionCount: 999,
        hasShownOnboarding: false,
        stars: [{ id: "s1" }],
      } as any

      await importSettings(importJson)

      const expected = {
        folders: [{ id: "f1" }],
        commandExecutionCount: 10,
        hasShownReviewRequest: true,
        hasDismissedPromptHistoryBanner: true,
        hasShownHubShareToast: true,
        hasShownOnboarding: true,
        stars: [],
      }
      expect(mockMigrate).toHaveBeenCalledWith(expected)
      expect(mockSettings.set).toHaveBeenCalledWith({
        ...expected,
        migrated: true,
      })
    })

    it("IE-15: should use default values when local states are undefined", async () => {
      mockEnhancedSettings.get.mockResolvedValue({} as any)

      await importSettings({ folders: [] } as any)

      expect(mockMigrate).toHaveBeenCalledWith({
        folders: [],
        commandExecutionCount: 0,
        hasShownReviewRequest: false,
        hasDismissedPromptHistoryBanner: false,
        hasShownHubShareToast: false,
        hasShownOnboarding: false,
        stars: [],
      })
    })

    it("IE-16: should propagate migrate error without saving", async () => {
      mockEnhancedSettings.get.mockResolvedValue({} as any)
      mockMigrate.mockRejectedValue(new Error("migrate failed"))

      await expect(importSettings({} as any)).rejects.toThrow("migrate failed")
      expect(mockSettings.set).not.toHaveBeenCalled()
    })
  })

  describe("checkBackupStatus", () => {
    const backup = (commandCount: number, folders?: unknown) => ({
      version: "1.0.0",
      timestamp: 1700000000000,
      commands: Array.from({ length: commandCount }, (_, i) => ({
        id: `${i}`,
      })),
      folders,
    })

    it("IE-17: should return AVAILABLE with info for existing backups", async () => {
      mockStorage.get.mockResolvedValue(backup(3, [{ id: "f1" }]))
      backupMocks.daily.getLastBackupData.mockResolvedValue(backup(2, []))
      backupMocks.weekly.getLastBackupData.mockResolvedValue(backup(1))

      const result = await checkBackupStatus()

      expect(mockStorage.get).toHaveBeenCalledWith(
        LOCAL_STORAGE_KEY.COMMANDS_BACKUP,
      )
      expect(result).toEqual({
        [BACKUP_TYPES.LEGACY]: entry(AVAILABLE, {
          timestamp: 1700000000000,
          commandCount: 3,
          folderCount: 1,
        }),
        [BACKUP_TYPES.DAILY]: entry(AVAILABLE, {
          timestamp: 1700000000000,
          commandCount: 2,
          folderCount: 0,
        }),
        [BACKUP_TYPES.WEEKLY]: entry(AVAILABLE, {
          timestamp: 1700000000000,
          commandCount: 1,
          folderCount: 0,
        }),
      })
    })

    it("IE-18: should return NONE for missing or invalid backups", async () => {
      mockStorage.get.mockResolvedValue({ commands: "invalid" })
      backupMocks.daily.getLastBackupData.mockResolvedValue(null)
      backupMocks.weekly.getLastBackupData.mockResolvedValue(undefined)

      const result = await checkBackupStatus()

      expect(result).toEqual(statusMap(NONE, NONE, NONE))
    })

    it("IE-19: should treat empty commands array as AVAILABLE", async () => {
      mockStorage.get.mockResolvedValue(backup(0))
      backupMocks.daily.getLastBackupData.mockResolvedValue(null)
      backupMocks.weekly.getLastBackupData.mockResolvedValue(null)

      const result = await checkBackupStatus()

      expect(result[BACKUP_TYPES.LEGACY].status).toBe(AVAILABLE)
      expect(result[BACKUP_TYPES.LEGACY].info?.commandCount).toBe(0)
    })

    it("IE-20: should return NONE for all when an error occurs", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      mockStorage.get.mockRejectedValue(new Error("storage error"))

      const result = await checkBackupStatus()

      expect(result).toEqual(statusMap(NONE, NONE, NONE))
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe("getDefaultBackupType", () => {
    it.each([
      [statusMap(AVAILABLE, AVAILABLE, AVAILABLE), BACKUP_TYPES.LEGACY],
      [statusMap(NONE, AVAILABLE, AVAILABLE), BACKUP_TYPES.DAILY],
      [statusMap(NONE, NONE, AVAILABLE), BACKUP_TYPES.WEEKLY],
      [statusMap(NONE, NONE, NONE), undefined],
      [statusMap(CHECKING, CHECKING, CHECKING), undefined],
    ])("IE-21: should pick the first available type (%#)", (map, expected) => {
      expect(getDefaultBackupType(map)).toBe(expected)
    })
  })

  describe("isCheckingBackups", () => {
    it("IE-22: should be true only when all backups are CHECKING", () => {
      expect(isCheckingBackups(statusMap(CHECKING, CHECKING, CHECKING))).toBe(
        true,
      )
      expect(isCheckingBackups(statusMap(CHECKING, NONE, CHECKING))).toBe(false)
      expect(isCheckingBackups(statusMap(NONE, NONE, NONE))).toBe(false)
    })
  })

  describe("hasAvailableBackup", () => {
    it("IE-23: should be true when any backup is AVAILABLE", () => {
      expect(hasAvailableBackup(statusMap(NONE, NONE, AVAILABLE))).toBe(true)
      expect(hasAvailableBackup(statusMap(NONE, NONE, NONE))).toBe(false)
      expect(hasAvailableBackup(statusMap(CHECKING, CHECKING, CHECKING))).toBe(
        false,
      )
    })
  })

  describe("getAvailableBackups", () => {
    it("IE-24: should return only available backups with legacy at the bottom", () => {
      const result = getAvailableBackups(
        statusMap(AVAILABLE, AVAILABLE, AVAILABLE),
      )
      expect(result.map(([type]) => type)).toEqual([
        BACKUP_TYPES.DAILY,
        BACKUP_TYPES.WEEKLY,
        BACKUP_TYPES.LEGACY,
      ])
    })

    it("IE-25: should exclude unavailable backups", () => {
      const result = getAvailableBackups(statusMap(AVAILABLE, NONE, CHECKING))
      expect(result).toEqual([[BACKUP_TYPES.LEGACY, entry(AVAILABLE)]])
    })

    it("IE-26: should return empty array when nothing is available", () => {
      expect(getAvailableBackups(statusMap(NONE, NONE, NONE))).toEqual([])
    })
  })

  describe("restoreFromBackup", () => {
    const commands = [{ id: "c1" }, { id: "c2" }]
    const folders = [{ id: "f1" }]

    beforeEach(() => {
      mockEnhancedSettings.get.mockResolvedValue({
        folders: [{ id: "old" }],
        other: "value",
      } as any)
      mockSettings.set.mockResolvedValue(true as any)
      mockStorage.setCommands.mockResolvedValue(true as any)
    })

    it.each([
      [BACKUP_TYPES.LEGACY, backupMocks.legacy],
      [BACKUP_TYPES.DAILY, backupMocks.daily],
      [BACKUP_TYPES.WEEKLY, backupMocks.weekly],
    ] as const)(
      "IE-27: should restore from the %s backup manager",
      async (type, manager) => {
        manager.restoreFromBackup.mockResolvedValue({ commands, folders })

        const result = await restoreFromBackup(type)

        expect(result).toBe(true)
        expect(manager.restoreFromBackup).toHaveBeenCalledTimes(1)
        expect(mockSettings.set).toHaveBeenCalledWith({
          folders,
          other: "value",
        })
        expect(mockStorage.setCommands).toHaveBeenCalledWith(commands)
      },
    )

    it("IE-28: should not update folders when backup has no folders", async () => {
      backupMocks.daily.restoreFromBackup.mockResolvedValue({
        commands,
        folders: [],
      })

      const result = await restoreFromBackup(BACKUP_TYPES.DAILY)

      expect(result).toBe(true)
      expect(mockSettings.set).not.toHaveBeenCalled()
      expect(mockStorage.setCommands).toHaveBeenCalledWith(commands)
    })

    it("IE-29: should return false without saving commands when backup has no commands", async () => {
      backupMocks.weekly.restoreFromBackup.mockResolvedValue({
        commands: [],
        folders: [],
      })

      const result = await restoreFromBackup(BACKUP_TYPES.WEEKLY)

      expect(result).toBe(false)
      expect(mockStorage.setCommands).not.toHaveBeenCalled()
    })

    it("IE-30: should propagate errors", async () => {
      backupMocks.legacy.restoreFromBackup.mockResolvedValue({
        commands,
        folders: [],
      })
      mockStorage.setCommands.mockRejectedValue(new Error("save failed"))

      await expect(restoreFromBackup(BACKUP_TYPES.LEGACY)).rejects.toThrow(
        "save failed",
      )
    })
  })
})
