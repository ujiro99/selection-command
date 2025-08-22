import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { Command, CommandFolder } from "@/types"
import { OPEN_MODE } from "@/const"
import { LOCAL_STORAGE_KEY } from "./const"
import {
  BackupData,
  BaseBackupManager,
  DailyBackupManager,
  WeeklyBackupManager,
  LegacyBackupManager,
} from "./backupManager"

// Mock dependencies
vi.mock("./index", () => ({
  BaseStorage: {
    get: vi.fn(),
    set: vi.fn(),
  },
}))

vi.mock("./commandStorage", () => ({
  CommandStorage: vi.fn().mockImplementation(() => ({
    loadCommands: vi.fn(),
  })),
}))

vi.mock("@/const", async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    VERSION: "1.2.3",
  }
})

// Import mocked modules
import { BaseStorage } from "./index"
import { CommandStorage } from "./commandStorage"

// Create concrete test class for abstract BaseBackupManager
class TestBackupManager extends BaseBackupManager {
  protected readonly BACKUP_KEY = LOCAL_STORAGE_KEY.DAILY_COMMANDS_BACKUP
  protected readonly BACKUP_INTERVAL_MS = 1000 // 1 second for testing
  protected readonly VERSION = "test"
}

describe("BackupManager", () => {
  let consoleErrorSpy: any
  let consoleDebugSpy: any
  let mockCommandStorage: any

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()

    // Mock console methods
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    consoleDebugSpy = vi.spyOn(console, "debug").mockImplementation(() => {})

    // Reset mocks
    mockCommandStorage = {
      loadCommands: vi.fn(),
    }
    ;(CommandStorage as any).mockImplementation(() => mockCommandStorage)
  })

  afterEach(() => {
    vi.useRealTimers()
    consoleErrorSpy.mockRestore()
    consoleDebugSpy.mockRestore()
  })

  describe("BaseBackupManager", () => {
    let manager: TestBackupManager

    beforeEach(() => {
      manager = new TestBackupManager()
    })

    describe("shouldBackup()", () => {
      it("BM-01: should return true when no backup exists", async () => {
        ;(BaseStorage.get as any).mockResolvedValue(null)

        const result = await manager.shouldBackup()

        expect(result).toBe(true)
      })

      it("BM-02: should return true when backup interval has passed", async () => {
        const lastBackup: BackupData = {
          version: "test",
          timestamp: Date.now() - 2000, // 2 seconds ago
          commands: [],
          folders: [],
        }
        ;(BaseStorage.get as any).mockResolvedValue(lastBackup)

        const result = await manager.shouldBackup()

        expect(result).toBe(true)
      })

      it("BM-03: should return false when backup interval has not passed", async () => {
        const lastBackup: BackupData = {
          version: "test",
          timestamp: Date.now() - 500, // 0.5 seconds ago
          commands: [],
          folders: [],
        }
        ;(BaseStorage.get as any).mockResolvedValue(lastBackup)

        const result = await manager.shouldBackup()

        expect(result).toBe(false)
      })

      it("BM-04: should return true when error occurs", async () => {
        ;(BaseStorage.get as any).mockRejectedValue(new Error("Storage error"))

        const result = await manager.shouldBackup()

        expect(result).toBe(true)
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Failed to get last backup data:",
          expect.any(Error),
        )
      })
    })

    describe("performBackup()", () => {
      it("BM-05: should perform backup with commands and folders", async () => {
        const mockCommands: Command[] = [
          {
            id: "cmd1",
            title: "Test Command",
            iconUrl: "https://example.com/icon.png",
            openMode: OPEN_MODE.POPUP,
            searchUrl: "https://example.com",
          },
        ]
        const mockFolders: CommandFolder[] = [
          {
            id: "folder1",
            title: "Test Folder",
          },
        ]
        const mockUserSettings = { folders: mockFolders }

        mockCommandStorage.loadCommands.mockResolvedValue(mockCommands)
        ;(BaseStorage.get as any).mockResolvedValue(mockUserSettings)
        ;(BaseStorage.set as any).mockResolvedValue(undefined)

        await manager.performBackup()

        expect(BaseStorage.set).toHaveBeenCalledWith(
          LOCAL_STORAGE_KEY.DAILY_COMMANDS_BACKUP,
          {
            version: "test",
            timestamp: expect.any(Number),
            commands: mockCommands,
            folders: mockFolders,
          },
        )
        expect(consoleDebugSpy).toHaveBeenCalledWith(
          "test backup completed: 1 commands and 1 folders backed up",
        )
      })

      it("BM-06: should skip backup when no commands or folders exist", async () => {
        mockCommandStorage.loadCommands.mockResolvedValue([])
        ;(BaseStorage.get as any).mockResolvedValue({})

        await manager.performBackup()

        expect(BaseStorage.set).not.toHaveBeenCalled()
        expect(consoleDebugSpy).toHaveBeenCalledWith(
          "No commands or folders to backup",
        )
      })

      it("BM-07: should handle missing folders gracefully", async () => {
        const mockCommands: Command[] = [
          {
            id: "cmd1",
            title: "Test Command",
            iconUrl: "https://example.com/icon.png",
            openMode: OPEN_MODE.POPUP,
            searchUrl: "https://example.com",
          },
        ]

        mockCommandStorage.loadCommands.mockResolvedValue(mockCommands)
        ;(BaseStorage.get as any).mockResolvedValue({}) // No folders property

        await manager.performBackup()

        expect(BaseStorage.set).toHaveBeenCalledWith(
          LOCAL_STORAGE_KEY.DAILY_COMMANDS_BACKUP,
          {
            version: "test",
            timestamp: expect.any(Number),
            commands: mockCommands,
            folders: [],
          },
        )
      })

      it("BM-08: should handle CommandStorage error", async () => {
        mockCommandStorage.loadCommands.mockRejectedValue(
          new Error("Command error"),
        )

        await manager.performBackup()

        expect(BaseStorage.set).not.toHaveBeenCalled()
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Failed to perform test backup:",
          expect.any(Error),
        )
      })

      it("BM-09: should handle BaseStorage error", async () => {
        const mockCommands: Command[] = [
          {
            id: "cmd1",
            title: "Test Command",
            iconUrl: "https://example.com/icon.png",
            openMode: OPEN_MODE.POPUP,
            searchUrl: "https://example.com",
          },
        ]

        mockCommandStorage.loadCommands.mockResolvedValue(mockCommands)
        ;(BaseStorage.get as any).mockResolvedValue({})
        ;(BaseStorage.set as any).mockRejectedValue(new Error("Storage error"))

        await manager.performBackup()

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Failed to perform test backup:",
          expect.any(Error),
        )
      })
    })

    describe("getLastBackupData()", () => {
      it("BM-10: should return backup data when valid data exists", async () => {
        const mockBackup: BackupData = {
          version: "test",
          timestamp: 12345,
          commands: [],
          folders: [],
        }
        ;(BaseStorage.get as any).mockResolvedValue(mockBackup)

        const result = await manager.getLastBackupData()

        expect(result).toEqual(mockBackup)
      })

      it("BM-11: should return null when no backup exists", async () => {
        ;(BaseStorage.get as any).mockResolvedValue(null)

        const result = await manager.getLastBackupData()

        expect(result).toBe(null)
      })

      it("BM-12: should return null when backup data is invalid (missing timestamp)", async () => {
        const invalidBackup = {
          version: "test",
          commands: [],
          folders: [],
        }
        ;(BaseStorage.get as any).mockResolvedValue(invalidBackup)

        const result = await manager.getLastBackupData()

        expect(result).toBe(null)
      })

      it("BM-13: should return null when backup data is invalid (commands not array)", async () => {
        const invalidBackup = {
          version: "test",
          timestamp: 12345,
          commands: "not-array",
          folders: [],
        }
        ;(BaseStorage.get as any).mockResolvedValue(invalidBackup)

        const result = await manager.getLastBackupData()

        expect(result).toBe(null)
      })

      it("BM-14: should handle missing folders as empty array", async () => {
        const backupWithoutFolders = {
          version: "test",
          timestamp: 12345,
          commands: [],
        }
        ;(BaseStorage.get as any).mockResolvedValue(backupWithoutFolders)

        const result = await manager.getLastBackupData()

        expect(result).toEqual({
          version: "test",
          timestamp: 12345,
          commands: [],
          folders: [],
        })
      })

      it("BM-15: should handle non-array folders as empty array", async () => {
        const backupWithInvalidFolders = {
          version: "test",
          timestamp: 12345,
          commands: [],
          folders: "not-array",
        }
        ;(BaseStorage.get as any).mockResolvedValue(backupWithInvalidFolders)

        const result = await manager.getLastBackupData()

        expect(result).toEqual({
          version: "test",
          timestamp: 12345,
          commands: [],
          folders: [],
        })
      })

      it("BM-16: should return null when storage error occurs", async () => {
        ;(BaseStorage.get as any).mockRejectedValue(new Error("Storage error"))

        const result = await manager.getLastBackupData()

        expect(result).toBe(null)
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Failed to get last backup data:",
          expect.any(Error),
        )
      })
    })

    describe("restoreFromBackup()", () => {
      it("BM-17: should restore commands and folders from backup", async () => {
        const mockBackup: BackupData = {
          version: "test",
          timestamp: 12345,
          commands: [
            {
              id: "cmd1",
              title: "Test Command",
              iconUrl: "https://example.com/icon.png",
              openMode: OPEN_MODE.POPUP,
              searchUrl: "https://example.com",
            },
          ],
          folders: [
            {
              id: "folder1",
              title: "Test Folder",
            },
          ],
        }
        ;(BaseStorage.get as any).mockResolvedValue(mockBackup)

        const result = await manager.restoreFromBackup()

        expect(result).toEqual({
          commands: mockBackup.commands,
          folders: mockBackup.folders,
        })
      })

      it("BM-18: should return empty arrays when no backup exists", async () => {
        ;(BaseStorage.get as any).mockResolvedValue(null)

        const result = await manager.restoreFromBackup()

        expect(result).toEqual({
          commands: [],
          folders: [],
        })
      })

      it("BM-19: should handle missing commands as empty array", async () => {
        const backupWithoutCommands = {
          version: "test",
          timestamp: 12345,
          folders: [],
        }
        ;(BaseStorage.get as any).mockResolvedValue(backupWithoutCommands)

        const result = await manager.restoreFromBackup()

        expect(result).toEqual({
          commands: [],
          folders: [],
        })
      })

      it("BM-20: should handle missing folders as empty array", async () => {
        const backupWithoutFolders = {
          version: "test",
          timestamp: 12345,
          commands: [],
        }
        ;(BaseStorage.get as any).mockResolvedValue(backupWithoutFolders)

        const result = await manager.restoreFromBackup()

        expect(result).toEqual({
          commands: [],
          folders: [],
        })
      })

      it("BM-21: should return empty arrays when error occurs", async () => {
        ;(BaseStorage.get as any).mockRejectedValue(new Error("Storage error"))

        const result = await manager.restoreFromBackup()

        expect(result).toEqual({
          commands: [],
          folders: [],
        })
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Failed to get last backup data:",
          expect.any(Error),
        )
      })
    })

    describe("getLastBackupDate()", () => {
      it("BM-22: should return Date when backup exists", async () => {
        const timestamp = 1234567890000
        const mockBackup: BackupData = {
          version: "test",
          timestamp,
          commands: [],
          folders: [],
        }
        ;(BaseStorage.get as any).mockResolvedValue(mockBackup)

        const result = await manager.getLastBackupDate()

        expect(result).toEqual(new Date(timestamp))
      })

      it("BM-23: should return null when no backup exists", async () => {
        ;(BaseStorage.get as any).mockResolvedValue(null)

        const result = await manager.getLastBackupDate()

        expect(result).toBe(null)
      })
    })
  })

  describe("DailyBackupManager", () => {
    let manager: DailyBackupManager

    beforeEach(() => {
      manager = new DailyBackupManager()
    })

    it("BM-24: should have correct configuration", () => {
      expect((manager as any).BACKUP_KEY).toBe(
        LOCAL_STORAGE_KEY.DAILY_COMMANDS_BACKUP,
      )
      expect((manager as any).BACKUP_INTERVAL_MS).toBe(24 * 60 * 60 * 1000)
      expect((manager as any).VERSION).toBe("daily")
    })
  })

  describe("WeeklyBackupManager", () => {
    let manager: WeeklyBackupManager

    beforeEach(() => {
      manager = new WeeklyBackupManager()
    })

    it("BM-25: should have correct configuration", () => {
      expect((manager as any).BACKUP_KEY).toBe(
        LOCAL_STORAGE_KEY.WEEKLY_COMMANDS_BACKUP,
      )
      expect((manager as any).BACKUP_INTERVAL_MS).toBe(7 * 24 * 60 * 60 * 1000)
      expect((manager as any).VERSION).toBe("weekly")
    })
  })

  describe("LegacyBackupManager", () => {
    let manager: LegacyBackupManager

    beforeEach(() => {
      manager = new LegacyBackupManager()
    })

    it("BM-26: should have correct configuration", () => {
      expect((manager as any).BACKUP_KEY).toBe(
        LOCAL_STORAGE_KEY.COMMANDS_BACKUP,
      )
      expect((manager as any).BACKUP_INTERVAL_MS).toBe(0)
      expect((manager as any).VERSION).toBe("1.2.3") // From mocked VERSION
    })

    describe("shouldBackup()", () => {
      it("BM-27: should return true when no backup exists", async () => {
        ;(BaseStorage.get as any).mockResolvedValue(null)

        const result = await manager.shouldBackup()

        expect(result).toBe(true)
      })

      it("BM-28: should return true when last backup is legacy version", async () => {
        const lastBackup: BackupData = {
          version: "legacy",
          timestamp: Date.now(),
          commands: [],
          folders: [],
        }
        ;(BaseStorage.get as any).mockResolvedValue(lastBackup)

        const result = await manager.shouldBackup()

        expect(result).toBe(true)
      })

      it("BM-29: should return true when current version is newer", async () => {
        const lastBackup: BackupData = {
          version: "1.0.0", // Older than current VERSION (1.2.3)
          timestamp: Date.now(),
          commands: [],
          folders: [],
        }
        ;(BaseStorage.get as any).mockResolvedValue(lastBackup)

        const result = await manager.shouldBackup()

        expect(result).toBe(true)
      })

      it("BM-29-a: should return true when current version is newer", async () => {
        const lastBackup: BackupData = {
          version: "1.2.2", // Older than current VERSION (1.2.3)
          timestamp: Date.now(),
          commands: [],
          folders: [],
        }
        ;(BaseStorage.get as any).mockResolvedValue(lastBackup)

        const result = await manager.shouldBackup()

        expect(result).toBe(true)
      })

      it("BM-30: should return false when current version is same or older", async () => {
        const lastBackup: BackupData = {
          version: "2.0.0", // Newer than current VERSION (1.2.3)
          timestamp: Date.now(),
          commands: [],
          folders: [],
        }
        ;(BaseStorage.get as any).mockResolvedValue(lastBackup)

        const result = await manager.shouldBackup()

        expect(result).toBe(false)
      })

      it("BM-30-a: should return false when current version is same or older", async () => {
        const lastBackup: BackupData = {
          version: "1.3.0", // Newer than current VERSION (1.2.3)
          timestamp: Date.now(),
          commands: [],
          folders: [],
        }
        ;(BaseStorage.get as any).mockResolvedValue(lastBackup)

        const result = await manager.shouldBackup()

        expect(result).toBe(false)
      })

      it("BM-31: should return true when error occurs", async () => {
        ;(BaseStorage.get as any).mockRejectedValue(new Error("Storage error"))

        const result = await manager.shouldBackup()

        expect(result).toBe(true)
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Failed to get last backup data:",
          expect.any(Error),
        )
      })
    })
  })
})
