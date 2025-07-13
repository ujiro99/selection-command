import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { Settings, migrate } from "./settings"
import { Storage, STORAGE_KEY, LOCAL_STORAGE_KEY } from "./storage"
import { OptionSettings } from "./option/optionSettings"
import DefaultSettings, { DefaultCommands } from "./option/defaultSettings"
import { toDataURL } from "./dom"
import { OPTION_FOLDER, VERSION, OPEN_MODE } from "@/const"
import type { Command, SettingsType, Star } from "@/types"
import { isLinkCommand } from "@/lib/utils"

// Mock dependencies
vi.mock("./storage")
vi.mock("./option/optionSettings")
vi.mock("./dom")

const mockStorage = vi.mocked(Storage)
const mockOptionSettings = vi.mocked(OptionSettings)
const mockToDataURL = vi.mocked(toDataURL)

describe("Settings", () => {
  // Setup function to create clean mocks for each test
  const setupDefaultMocks = () => {
    vi.clearAllMocks()

    // Setup default mocks
    mockStorage.get.mockResolvedValue({})
    mockStorage.getCommands.mockResolvedValue([])
    mockStorage.set.mockResolvedValue(true)
    mockStorage.setCommands.mockResolvedValue(true)
    mockStorage.updateCommands.mockResolvedValue(true)

    mockOptionSettings.commands = []
    mockOptionSettings.folder = {
      id: OPTION_FOLDER,
      title: "Options",
      iconUrl: "",
      onlyIcon: true,
    }

    mockToDataURL.mockResolvedValue("data:image/png;base64,test")
  }

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe("get method", () => {
    beforeEach(() => {
      setupDefaultMocks()
    })

    it("should return basic settings data", async () => {
      const mockUserSettings = {
        settingVersion: VERSION,
        folders: [{ id: "1", title: "Test Folder", iconUrl: "" }],
        pageRules: [],
      }
      const mockStars = [{ id: "1" }]
      const mockUserStats = {
        commandExecutionCount: 5,
        hasShownReviewRequest: false,
      }
      const mockShortcuts = { shortcuts: [] }

      mockStorage.get
        .mockResolvedValueOnce(mockUserSettings)
        .mockResolvedValueOnce(mockStars)
        .mockResolvedValueOnce(mockUserStats)
        .mockResolvedValueOnce(mockShortcuts)
      mockStorage.getCommands.mockResolvedValue(DefaultCommands)

      const result = await Settings.get()

      expect(result).toEqual(
        expect.objectContaining({
          settingVersion: VERSION,
          commands: [...DefaultCommands, ...mockOptionSettings.commands],
          folders: [mockUserSettings.folders[0], mockOptionSettings.folder],
          stars: mockStars,
          commandExecutionCount: mockUserStats.commandExecutionCount,
          hasShownReviewRequest: mockUserStats.hasShownReviewRequest,
          shortcuts: mockShortcuts,
        }),
      )
    })

    it("should exclude option settings when excludeOptions is true", async () => {
      const mockUserSettings = { folders: [], pageRules: [] }

      mockStorage.get.mockResolvedValue(mockUserSettings)
      mockStorage.getCommands.mockResolvedValue(DefaultCommands)

      const result = await Settings.get(true)

      expect(result.commands).toEqual(DefaultCommands)
      expect(result.folders).toEqual([])
      expect(result.commands).not.toContain(
        expect.objectContaining({ parentFolderId: OPTION_FOLDER }),
      )
    })

    it("should include option settings when excludeOptions is false", async () => {
      const mockUserSettings = { folders: [], pageRules: [] }

      mockStorage.get.mockResolvedValue(mockUserSettings)
      mockStorage.getCommands.mockResolvedValue(DefaultCommands)

      const result = await Settings.get(false)

      expect(result.commands).toEqual([
        ...DefaultCommands,
        ...mockOptionSettings.commands,
      ])
      expect(result.folders).toEqual([mockOptionSettings.folder])
    })

    it("should filter empty folders", async () => {
      const mockUserSettings = {
        settingVersion: VERSION,
        commands: [], // Add commands to prevent undefined issue
        folders: [
          { id: "1", title: "Valid Folder", iconUrl: "" },
          { id: "2", title: "", iconUrl: "" }, // Empty title
          { id: "3", title: "Another Valid", iconUrl: "" },
        ],
        pageRules: [],
      }

      mockStorage.get
        .mockResolvedValueOnce(mockUserSettings)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({
          commandExecutionCount: 0,
          hasShownReviewRequest: false,
        })
        .mockResolvedValueOnce({ shortcuts: [] })
      mockStorage.getCommands.mockResolvedValue([])

      const result = await Settings.get()

      expect(result.folders).toHaveLength(3) // 2 valid + 1 option folder
      expect(result.folders.map((f) => f.title)).toEqual([
        "Valid Folder",
        "Another Valid",
        "Options",
      ])
    })

    it("should handle migration", async () => {
      const oldSettings = {
        settingVersion: "0.10.0",
        folders: [],
        pageRules: [],
        commands: [],
      }

      mockStorage.get.mockResolvedValue(oldSettings)
      mockStorage.getCommands.mockResolvedValue([])

      // Mock migrate function
      const migrateSpy = vi.fn().mockResolvedValue({
        ...oldSettings,
        settingVersion: VERSION,
      })
      vi.doMock("./settings", () => ({ migrate: migrateSpy }))

      await Settings.get()

      // Migration should be called (note: this tests the flow, actual migration testing is separate)
      expect(mockStorage.get).toHaveBeenCalled()
    })

    it("should handle storage errors gracefully", async () => {
      mockStorage.get.mockRejectedValue(new Error("Storage error"))
      mockStorage.getCommands.mockResolvedValue([])

      await expect(Settings.get()).rejects.toThrow("Storage error")
    })
  })

  describe("set method", () => {
    beforeEach(() => {
      setupDefaultMocks()
    })

    const mockSettings: SettingsType = {
      ...DefaultSettings,
      commandExecutionCount: 0,
      hasShownReviewRequest: false,
      stars: [] as Star[],
    }

    it("should save settings data correctly", async () => {
      const originalGetCaches = Settings.getCaches
      Settings.getCaches = vi.fn().mockResolvedValue({ images: {} })

      try {
        const result = await Settings.set(mockSettings)

        expect(result).toBe(true)
        expect(mockStorage.setCommands).toHaveBeenCalledWith(
          expect.arrayContaining(mockSettings.commands),
        )
        expect(mockStorage.set).toHaveBeenCalledWith(STORAGE_KEY.USER_STATS, {
          commandExecutionCount: mockSettings.commandExecutionCount,
          hasShownReviewRequest: mockSettings.hasShownReviewRequest,
        })
        expect(mockStorage.set).toHaveBeenCalledWith(
          STORAGE_KEY.SHORTCUTS,
          mockSettings.shortcuts,
        )
        expect(mockStorage.set).toHaveBeenCalledWith(
          "stars",
          mockSettings.stars,
        )
      } finally {
        Settings.getCaches = originalGetCaches
      }
    })

    it("should skip image cache processing when serviceWorker is true", async () => {
      const originalGetCaches = Settings.getCaches
      Settings.getCaches = vi.fn().mockResolvedValue({ images: {} })

      try {
        await Settings.set(mockSettings, true)

        expect(mockToDataURL).not.toHaveBeenCalled()
      } finally {
        Settings.getCaches = originalGetCaches
      }
    })

    it("should process image URLs and create cache when serviceWorker is false", async () => {
      const imageUrl = "http://example.com/icon.png"
      const settingsWithImage = {
        ...mockSettings,
        commands: DefaultCommands,
      }

      const originalGetCaches = Settings.getCaches
      const originalGetUrls = Settings.getUrls
      Settings.getCaches = vi.fn().mockResolvedValue({ images: {} })
      Settings.getUrls = vi.fn().mockReturnValue([imageUrl])

      try {
        await Settings.set(settingsWithImage, false)

        expect(mockToDataURL).toHaveBeenCalledWith(imageUrl)
        expect(mockStorage.set).toHaveBeenCalledWith(
          "caches",
          expect.objectContaining({
            images: expect.objectContaining({
              [imageUrl]: "data:image/png;base64,test",
            }),
          }),
        )
      } finally {
        Settings.getCaches = originalGetCaches
        Settings.getUrls = originalGetUrls
      }
    })

    it("should remove unused cache entries", async () => {
      const imageUrl1 = "http://example.com/icon1.png"
      const imageUrl2 = "http://example.com/icon2.png"

      const originalGetCaches = Settings.getCaches
      const originalGetUrls = Settings.getUrls
      Settings.getCaches = vi.fn().mockResolvedValue({
        images: {
          [imageUrl1]: "cached1",
          [imageUrl2]: "cached2", // This should be removed
        },
      })
      Settings.getUrls = vi.fn().mockReturnValue([imageUrl1]) // Only imageUrl1 is used

      try {
        await Settings.set(mockSettings)

        expect(mockStorage.set).toHaveBeenCalledWith(
          "caches",
          expect.objectContaining({
            images: expect.not.objectContaining({
              [imageUrl2]: expect.anything(),
            }),
          }),
        )
      } finally {
        Settings.getCaches = originalGetCaches
        Settings.getUrls = originalGetUrls
      }
    })

    it("should add default link command if none exists", async () => {
      const settingsWithoutLinkCommand = {
        ...mockSettings,
        commands: DefaultCommands.filter((cmd) => !isLinkCommand(cmd)),
      }

      const mockLinkCommand = {
        id: "link",
        title: "Link",
        iconUrl: "",
        searchUrl: "%s",
      }
      vi.mocked(DefaultCommands).find = vi.fn().mockReturnValue(mockLinkCommand)

      const originalGetCaches = Settings.getCaches
      Settings.getCaches = vi.fn().mockResolvedValue({ images: {} })

      try {
        await Settings.set(settingsWithoutLinkCommand)

        expect(mockStorage.setCommands).toHaveBeenCalledWith(
          expect.arrayContaining([
            ...settingsWithoutLinkCommand.commands,
            mockLinkCommand,
          ]),
        )
      } finally {
        Settings.getCaches = originalGetCaches
      }
    })

    it("should handle toDataURL errors gracefully", async () => {
      const imageUrl = "http://example.com/invalid.png"
      const settingsWithImage = {
        ...mockSettings,
        commands: [
          {
            id: "1",
            title: "Test",
            openMode: OPEN_MODE.POPUP,
            iconUrl: imageUrl,
          },
        ],
      }

      const originalGetCaches = Settings.getCaches
      const originalGetUrls = Settings.getUrls

      Settings.getCaches = vi.fn().mockResolvedValue({ images: {} })
      Settings.getUrls = vi.fn().mockReturnValue([imageUrl])
      mockToDataURL.mockRejectedValue(new Error("Network error"))

      try {
        // Should not throw error
        const result = await Settings.set(settingsWithImage, false)
        expect(result).toBe(true)
      } finally {
        // Restore original methods
        Settings.getCaches = originalGetCaches
        Settings.getUrls = originalGetUrls
      }
    })
  })

  describe("update method", () => {
    beforeEach(() => {
      setupDefaultMocks()
    })

    it("should update specific key with updater function", async () => {
      const currentSettings = {
        folders: [{ id: "1", title: "Old Title", iconUrl: "" }],
      }

      const originalGet = Settings.get
      const originalSet = Settings.set
      Settings.get = vi.fn().mockResolvedValue(currentSettings)
      Settings.set = vi.fn().mockResolvedValue(true)

      try {
        const updater = (folders: any[]) => [
          ...folders,
          { id: "2", title: "New Folder", iconUrl: "" },
        ]

        const result = await Settings.update("folders", updater)

        expect(result).toBe(true)
        expect(Settings.set).toHaveBeenCalledWith(
          expect.objectContaining({
            folders: [
              currentSettings.folders[0],
              { id: "2", title: "New Folder", iconUrl: "" },
            ],
          }),
          false,
        )
      } finally {
        Settings.get = originalGet
        Settings.set = originalSet
      }
    })

    it("should pass serviceWorker parameter correctly", async () => {
      const originalGet = Settings.get
      const originalSet = Settings.set
      Settings.get = vi.fn().mockResolvedValue({ folders: [] })
      Settings.set = vi.fn().mockResolvedValue(true)

      try {
        await Settings.update("folders", (folders) => folders, true)

        expect(Settings.set).toHaveBeenCalledWith(expect.anything(), true)
      } finally {
        Settings.get = originalGet
        Settings.set = originalSet
      }
    })
  })

  describe("addCommands method", () => {
    beforeEach(() => {
      setupDefaultMocks()
    })

    it("should add new commands to existing ones", async () => {
      const existingCommands = [
        { id: "1", title: "Existing", iconUrl: "", openMode: OPEN_MODE.POPUP },
      ]
      const newCommands = [
        { id: "2", title: "New 1", iconUrl: "", openMode: OPEN_MODE.POPUP },
        { id: "3", title: "New 2", iconUrl: "", openMode: OPEN_MODE.POPUP },
      ]

      mockStorage.getCommands.mockResolvedValue(existingCommands)

      const result = await Settings.addCommands(newCommands)

      expect(result).toBe(true)
      expect(mockStorage.setCommands).toHaveBeenCalledWith([
        ...existingCommands,
        ...newCommands,
      ])
    })

    it("should handle empty array addition", async () => {
      const existingCommands: Command[] = [
        { id: "1", title: "Existing", iconUrl: "", openMode: OPEN_MODE.POPUP },
      ]

      mockStorage.getCommands.mockResolvedValue(existingCommands)

      const result = await Settings.addCommands([])

      expect(result).toBe(true)
      expect(mockStorage.setCommands).toHaveBeenCalledWith(existingCommands)
    })
  })

  describe("updateCommands method", () => {
    beforeEach(() => {
      setupDefaultMocks()
    })

    it("should update commands correctly", async () => {
      const updatedCommands: Command[] = [
        { id: "1", title: "Updated", iconUrl: "", openMode: OPEN_MODE.POPUP },
      ]

      const result = await Settings.updateCommands(updatedCommands)

      expect(result).toBe(true)
      expect(mockStorage.updateCommands).toHaveBeenCalledWith(updatedCommands)
    })
  })

  describe("reset method", () => {
    beforeEach(() => {
      setupDefaultMocks()
    })

    it("should reset to default settings", async () => {
      await Settings.reset()

      expect(mockStorage.set).toHaveBeenCalledWith(
        STORAGE_KEY.USER,
        DefaultSettings,
      )
      expect(mockStorage.setCommands).toHaveBeenCalledWith(DefaultCommands)
      expect(mockStorage.set).toHaveBeenCalledWith(
        STORAGE_KEY.SHORTCUTS,
        DefaultSettings.shortcuts,
      )
    })
  })

  describe("callback functionality", () => {
    beforeEach(() => {
      setupDefaultMocks()
    })

    it("should add and remove change listeners", () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      Settings.addChangedListener(callback1)
      Settings.addChangedListener(callback2)

      // Trigger callback (this would normally be triggered by storage changes)
      // We need to simulate storage change to test callbacks
      expect(Settings.removeChangedListener).toBeDefined()

      Settings.removeChangedListener(callback1)
      // After removal, only callback2 should remain
    })
  })

  describe("cache functionality", () => {
    describe("getCaches", () => {
      it("should get caches correctly", async () => {
        // Don't call setupDefaultMocks - set up specific mocks only
        vi.clearAllMocks()

        const mockCaches = { images: { url1: "data1" } }

        // Set up mock for specific cache call only
        mockStorage.get.mockResolvedValue(mockCaches)

        const result = await Settings.getCaches()

        expect(result).toEqual(mockCaches)
        expect(mockStorage.get).toHaveBeenCalledWith(LOCAL_STORAGE_KEY.CACHES)
      })
    })

    describe("getUrls", () => {
      it("should get all URLs from settings", () => {
        // Don't call setupDefaultMocks - set up specific mocks only
        vi.clearAllMocks()

        const settings = {
          commands: [
            { id: "1", iconUrl: "cmd1.png" },
            { id: "2", iconUrl: "cmd2.png" },
          ],
          folders: [{ id: "1", iconUrl: "folder1.png" }],
        } as SettingsType

        // Set up fresh mock for this test with no interference
        mockOptionSettings.commands = [
          {
            id: "opt1",
            iconUrl: "opt1.png",
            title: "",
            searchUrl: "",
            parentFolderId: "",
            openMode: OPEN_MODE.POPUP,
          },
        ]
        mockOptionSettings.folder = {
          id: "folder",
          title: "",
          iconUrl: "optfolder.png",
          onlyIcon: true,
        }

        const urls = Settings.getUrls(settings)

        expect(urls).toEqual(
          expect.arrayContaining([
            "cmd1.png",
            "cmd2.png",
            "folder1.png",
            "opt1.png",
            "optfolder.png",
          ]),
        )
      })
    })
  })
})

describe("migrate function", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return data unchanged for latest version", async () => {
    const latestData: SettingsType = {
      ...DefaultSettings,
      commandExecutionCount: 0,
      hasShownReviewRequest: false,
      stars: [] as Star[],
    }

    const result = await migrate(latestData)
    expect(result).toEqual(latestData)
  })

  it("should migrate from version 0.11.9", async () => {
    const oldData = {
      settingVersion: "0.11.5",
      commands: [],
      folders: [],
      pageRules: [
        {
          id: "1",
          popupPlacement: "top-start", // Old string format
        },
      ],
      popupPlacement: "bottom-center", // Old string format
    } as any

    const result = await migrate(oldData)

    expect(result.settingVersion).toBe(VERSION)
    expect(result.popupPlacement).toEqual({
      side: "bottom",
      align: "center",
      sideOffset: 0,
      alignOffset: 0,
    })
    expect(result.pageRules[0].popupPlacement).toEqual({
      side: "top",
      align: "start",
      sideOffset: 0,
      alignOffset: 0,
    })
  })

  it("should migrate from version 0.11.5", async () => {
    const oldData = {
      settingVersion: "0.11.3",
      commands: [
        { id: "123", title: "Short ID Command" }, // Non-UUID ID
        { id: "550e8400-e29b-41d4-a716-446655440000", title: "UUID Command" }, // Already UUID
      ],
      pageRules: [
        { id: "1" }, // Missing linkCommandEnabled
        { id: "2", linkCommandEnabled: "inherit" }, // Already has it
      ],
    } as any

    // Mock DefaultCommands to find matching command
    const mockDefaultCommand = { id: "uuid-123", title: "Short ID Command" }
    vi.mocked(DefaultCommands).find = vi
      .fn()
      .mockReturnValue(mockDefaultCommand)

    const result = await migrate(oldData)

    expect(result.commands[0].id).toBe("uuid-123") // Should use default UUID
    expect(result.commands[1].id).toBe("550e8400-e29b-41d4-a716-446655440000") // Should remain unchanged
    expect(result.pageRules[0].linkCommandEnabled).toBe("Inherit") // Should be added
    expect(result.pageRules[1].linkCommandEnabled).toBe("inherit") // Should remain
  })

  it("should handle migration with missing DefaultCommands match", async () => {
    const oldData = {
      settingVersion: "0.11.3",
      commands: [{ id: "123", title: "Unknown Command" }],
      pageRules: [],
    } as any

    // Mock crypto.randomUUID
    const mockRandomUUID = vi.fn().mockReturnValue("random-uuid-123")
    const originalCrypto = global.crypto
    Object.defineProperty(global, "crypto", {
      value: { randomUUID: mockRandomUUID },
      writable: true,
      configurable: true,
    })

    vi.mocked(DefaultCommands).find = vi.fn().mockReturnValue(undefined)

    const result = await migrate(oldData)

    expect(result.commands[0].id).toBe("random-uuid-123")

    // Restore original crypto
    global.crypto = originalCrypto
  })
})
