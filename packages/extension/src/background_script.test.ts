import { describe, it, expect, vi, beforeEach } from "vitest"
import { enhancedSettings } from "@/services/settings/enhancedSettings"
import { Settings } from "@/services/settings/settings"
import { BgCommand } from "@/services/ipc"
import { POPUP_ENABLED, LINK_COMMAND_ENABLED } from "@/const"

// Mock dependencies
vi.mock("@/services/settings/enhancedSettings")
vi.mock("@/services/settings/settings")
vi.mock("@/services/storage")
vi.mock("@/services/chrome")
vi.mock("@/services/backgroundData")
vi.mock("@/services/contextMenus")
vi.mock("@/action/background")
vi.mock("@/action/helper")
vi.mock("@/services/pageAction/background")
vi.mock("@import-if", () => ({
  importIf: vi.fn(),
}))

const mockEnhancedSettings = vi.mocked(enhancedSettings)
const mockSettings = vi.mocked(Settings)

describe("Background Script Migration", () => {
  // Common test data factory
  const createTestSettings = (overrides = {}) => ({
    commands: [
      {
        id: "test-command-123",
        title: "Test Search Command",
        searchUrl: "https://example.com/search?q=%s",
        iconUrl: "https://example.com/icon.png",
        openMode: "tab" as const,
        parentFolderId: "",
        popupOption: {
          width: 400,
          height: 300,
        },
      },
      {
        id: "other-command",
        title: "Other Command",
        searchUrl: "https://other.com/search?q=%s",
        iconUrl: "",
        openMode: "tab" as const,
        parentFolderId: "",
      },
    ],
    folders: [],
    pageRules: [
      {
        urlPattern: "https://existing.com",
        popupEnabled: "enable" as const,
        popupPlacement: { x: 100, y: 100 },
        linkCommandEnabled: "inherit" as const,
      },
    ],
    stars: [{ id: "existing-star-1" }, { id: "existing-star-2" }],
    shortcuts: {
      shortcuts: [
        {
          id: "test-shortcut-cmd",
          commandId: "test-command-123",
          key: "Ctrl+Shift+T",
          noSelectionBehavior: "DO_NOTHING" as const,
        },
        {
          id: "other-shortcut",
          commandId: "other-command",
          key: "Ctrl+Shift+O",
          noSelectionBehavior: "DO_NOTHING" as const,
        },
      ],
    },
    commandExecutionCount: 0,
    hasShownReviewRequest: false,
    ...overrides,
  })

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mocks
    mockEnhancedSettings.get.mockResolvedValue({
      commands: [],
      folders: [],
      pageRules: [],
      stars: [],
      shortcuts: { shortcuts: [] },
      commandExecutionCount: 0,
      hasShownReviewRequest: false,
    } as any)

    mockSettings.get.mockResolvedValue({
      commands: [],
      folders: [],
      pageRules: [],
      stars: [],
      shortcuts: { shortcuts: [] },
      commandExecutionCount: 0,
      hasShownReviewRequest: false,
    } as any)

    mockSettings.set.mockResolvedValue(true)
    mockSettings.updateCommands.mockResolvedValue(true)
  })

  it("MG-01-a: should call enhancedSettings.get() in addPageRule function and pass correct values to Settings.set", async () => {
    // Setup initial settings data that enhancedSettings.get() should return
    const initialSettings = createTestSettings()
    mockEnhancedSettings.get.mockResolvedValue(initialSettings as any)

    // Import the module and get test exports
    const { testExports } = await import("./background_script")

    // Call the addPageRule function
    const mockResponse = vi.fn()
    const mockSender = {} as chrome.runtime.MessageSender
    const newUrl = "https://example.com"

    testExports.commandFuncs[BgCommand.addPageRule](
      { url: newUrl },
      mockSender,
      mockResponse,
    )

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 10))

    // This should fail initially because the function still uses Settings.get() instead of enhancedSettings.get()
    expect(mockEnhancedSettings.get).toHaveBeenCalled()

    // Verify that Settings.set was called with the correct merged data
    // This test expects the function to:
    // 1. Call enhancedSettings.get() to get current settings
    // 2. Merge the new pageRule with existing ones
    // 3. Call Settings.set() with the merged result
    expect(mockSettings.set).toHaveBeenCalledWith(
      expect.objectContaining({
        pageRules: expect.arrayContaining([
          // Existing rule should be preserved
          expect.objectContaining({
            urlPattern: "https://existing.com",
          }),
          // New rule should be added
          expect.objectContaining({
            urlPattern: newUrl,
            popupEnabled: POPUP_ENABLED.ENABLE,
            linkCommandEnabled: LINK_COMMAND_ENABLED.INHERIT,
          }),
        ]),
      }),
      true,
    )
  })

  it("MG-01-b: should call enhancedSettings.get() in updateWindowSize function and pass correct values to Settings.updateCommands", async () => {
    // Setup initial settings data that enhancedSettings.get() should return
    const testCommandId = "test-command-123" // Use the same ID as in createTestSettings
    const initialSettings = createTestSettings()

    mockEnhancedSettings.get.mockResolvedValue(initialSettings as any)

    // Import the module and get test exports
    const { testExports } = await import("./background_script")

    // Call the updateWindowSize function with new dimensions
    const newWidth = 800
    const newHeight = 600
    await testExports.updateWindowSize(testCommandId, newWidth, newHeight)

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 10))

    // This should fail initially because the function still uses Settings.get() instead of enhancedSettings.get()
    expect(mockEnhancedSettings.get).toHaveBeenCalled()

    // Verify that Settings.updateCommands was called with the updated command
    // The test expects the function to:
    // 1. Call enhancedSettings.get() to get current settings
    // 2. Find the command by ID and update its popupOption
    // 3. Call Settings.updateCommands() with the updated command
    expect(mockSettings.updateCommands).toHaveBeenCalledWith([
      expect.objectContaining({
        id: testCommandId,
        title: "Test Search Command",
        popupOption: {
          width: newWidth,
          height: newHeight,
        },
      }),
    ])
  })

  it("MG-01-c: should call enhancedSettings.get() in toggleStar function and pass correct values to Settings.set", async () => {
    // Test case 1: Adding a star (ID not in stars array)
    const testId = "new-test-star"
    const initialSettings = createTestSettings()

    mockEnhancedSettings.get.mockResolvedValue(initialSettings as any)

    // Import the module and get test exports
    const { testExports } = await import("./background_script")

    // Call the toggleStar function to add a new star
    const mockResponse = vi.fn()
    const mockSender = {} as chrome.runtime.MessageSender

    testExports.commandFuncs[BgCommand.toggleStar](
      { id: testId },
      mockSender,
      mockResponse,
    )

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 10))

    // This should fail initially because the function still uses Settings.get() instead of enhancedSettings.get()
    expect(mockEnhancedSettings.get).toHaveBeenCalled()

    // Verify that Settings.set was called with the star added
    expect(mockSettings.set).toHaveBeenCalledWith(
      expect.objectContaining({
        stars: expect.arrayContaining([
          { id: "existing-star-1" },
          { id: "existing-star-2" },
          { id: testId }, // New star should be added
        ]),
      }),
      true,
    )
  })

  it("MG-01-c-remove: should remove existing star in toggleStar function", async () => {
    // Test case 2: Removing a star (ID exists in stars array)
    const existingStarId = "existing-star-2"
    const initialSettings = createTestSettings({
      stars: [
        { id: "existing-star-1" },
        { id: existingStarId },
        { id: "existing-star-3" },
      ],
    })

    mockEnhancedSettings.get.mockResolvedValue(initialSettings as any)

    // Import the module and get test exports
    const { testExports } = await import("./background_script")

    // Call the toggleStar function to remove an existing star
    const mockResponse = vi.fn()
    const mockSender = {} as chrome.runtime.MessageSender

    testExports.commandFuncs[BgCommand.toggleStar](
      { id: existingStarId },
      mockSender,
      mockResponse,
    )

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 10))

    // This should fail initially because the function still uses Settings.get() instead of enhancedSettings.get()
    expect(mockEnhancedSettings.get).toHaveBeenCalled()

    // Verify that Settings.set was called with the star removed
    expect(mockSettings.set).toHaveBeenCalledWith(
      expect.objectContaining({
        stars: expect.arrayContaining([
          { id: "existing-star-1" },
          { id: "existing-star-3" },
        ]),
      }),
      true,
    )

    // Verify that the removed star is not in the array
    const setCall =
      mockSettings.set.mock.calls[mockSettings.set.mock.calls.length - 1]
    const settingsArg = setCall[0]
    expect(settingsArg.stars).not.toContain(
      expect.objectContaining({ id: existingStarId }),
    )
  })

  it("MG-01-d: should call enhancedSettings.get() in onCommand function and pass correct command to action/background.execute", async () => {
    // Setup test data
    const testShortcutId = "test-shortcut-cmd"
    const testCommandId = "test-command-123"
    const initialSettings = createTestSettings()

    mockEnhancedSettings.get.mockResolvedValue(initialSettings as any)

    // Mock chrome.tabs.query to return a valid tab
    ;(chrome.tabs.query as any).mockResolvedValue([
      { id: 1, url: "https://example.com", windowId: 1 },
    ])

    // Mock Storage.get for selection text
    const mockStorageGet = vi.fn().mockResolvedValue("test selection text")
    vi.doMock("@/services/storage", () => ({
      Storage: {
        get: mockStorageGet,
      },
      SESSION_STORAGE_KEY: {
        SELECTION_TEXT: "selectionText",
      },
      LOCAL_STORAGE_KEY: {
        CLIENT_ID: "clientId",
      },
    }))

    // Mock the execute function from action/background
    const mockExecute = vi.fn().mockResolvedValue(true)
    vi.doMock("@/action/background", () => ({
      execute: mockExecute,
    }))

    // Mock Ipc.sendTab to simulate tab execution failure (to force background execution)
    const mockIpcSendTab = vi
      .fn()
      .mockResolvedValue(new Error("Tab execution failed"))
    vi.doMock("@/services/ipc", () => ({
      Ipc: {
        sendTab: mockIpcSendTab,
        addListener: vi.fn(),
      },
      BgCommand: {
        addPageRule: "addPageRule",
        toggleStar: "toggleStar",
      },
      TabCommand: {
        executeAction: "executeAction",
      },
    }))

    // Clear the module cache to ensure fresh import
    vi.resetModules()

    // Import the module to trigger the listener setup
    await import("./background_script")

    // Get the registered listener function
    const listenerCalls = (chrome.commands.onCommand.addListener as any).mock
      .calls
    expect(listenerCalls.length).toBeGreaterThan(0)

    const commandListener = listenerCalls[0][0]

    // Call the listener with our test shortcut command
    await commandListener(testShortcutId)

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 10))

    // This should fail initially because the function still uses Settings.get() instead of enhancedSettings.get()
    expect(mockEnhancedSettings.get).toHaveBeenCalled()

    // Verify that the execute function was called with the correct command
    // The test expects the function to:
    // 1. Call enhancedSettings.get() to get current settings
    // 2. Find the shortcut by commandName (testShortcutId)
    // 3. Find the command by shortcut.commandId (testCommandId)
    // 4. Call execute() from action/background with the found command
    expect(mockExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        command: expect.objectContaining({
          id: testCommandId,
          title: "Test Search Command",
          searchUrl: "https://example.com/search?q=%s",
          openMode: "tab",
        }),
        position: { x: 10000, y: 10000 },
        selectionText: "test selection text",
        target: null,
        useClipboard: false,
      }),
    )
  })
})
