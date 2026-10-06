import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { enhancedSettings } from "@/services/settings/enhancedSettings"
import { Settings } from "@/services/settings/settings"
import { ServiceWorkerCommand } from "@/services/ipc"
import { NEW_HUB_URL, VERSION } from "@/const"
// Imported before any vi.doMock, so this is the real event name table.
import { ANALYTICS_EVENTS } from "@/services/analytics"

// Replace chrome.sidePanel to emulate browsers with/without the API.
const setSidePanel = (value: unknown) => {
  ;(chrome as unknown as { sidePanel: unknown }).sidePanel = value
}

// Mock dependencies
vi.mock("@/services/settings/enhancedSettings")
vi.mock("@/services/settings/settings")
vi.mock("@/services/settings/settingsCache")
vi.mock("@/services/storage")
vi.mock("@/services/chrome")
vi.mock("@/services/serviceWorkerData")
vi.mock("@/services/contextMenus")
vi.mock("@/action/serviceWorker")
vi.mock("@/action/helper")
vi.mock("@/services/pageAction/serviceWorker")
vi.mock("@import-if", () => ({
  importIf: vi.fn(),
}))

const mockEnhancedSettings = vi.mocked(enhancedSettings)
const mockSettings = vi.mocked(Settings)

describe("Service Worker Migration", () => {
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

  it("MG-01-a: should call enhancedSettings.get() in addPageRule and open option page with addPageRule param when no matching rule exists", async () => {
    const initialSettings = createTestSettings()
    mockEnhancedSettings.get.mockResolvedValue(initialSettings as any)

    const { testExports } = await import("../service_worker")

    const mockSender = {} as chrome.runtime.MessageSender
    const newUrl = "https://example.com"

    testExports.commandFuncs[ServiceWorkerCommand.addPageRule](
      { url: newUrl },
      mockSender,
      vi.fn(),
    )

    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(mockEnhancedSettings.get).toHaveBeenCalled()
    expect(mockSettings.set).not.toHaveBeenCalled()
    expect(chrome.tabs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining(
          `addPageRule=${encodeURIComponent(newUrl)}`,
        ),
      }),
    )
  })

  it("MG-01-b: should call enhancedSettings.get() in updateWindowSize function and pass correct values to Settings.updateCommands", async () => {
    // Setup initial settings data that enhancedSettings.get() should return
    const testCommandId = "test-command-123" // Use the same ID as in createTestSettings
    const initialSettings = createTestSettings()

    mockEnhancedSettings.get.mockResolvedValue(initialSettings as any)

    // Import the module and get test exports
    const { testExports } = await import("../service_worker")

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
    const { testExports } = await import("../service_worker")

    // Call the toggleStar function to add a new star
    const mockResponse = vi.fn()
    const mockSender = {} as chrome.runtime.MessageSender

    testExports.commandFuncs[ServiceWorkerCommand.toggleStar](
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
    const { testExports } = await import("../service_worker")

    // Call the toggleStar function to remove an existing star
    const mockResponse = vi.fn()
    const mockSender = {} as chrome.runtime.MessageSender

    testExports.commandFuncs[ServiceWorkerCommand.toggleStar](
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

  it("MG-01-d: should call enhancedSettings.get() in onCommand function and pass correct command to action/serviceWorker.execute", async () => {
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

    // Mock the execute function from action/serviceWorker
    const mockExecute = vi.fn().mockResolvedValue(true)
    vi.doMock("@/action/serviceWorker", () => ({
      execute: mockExecute,
    }))

    // Mock Ipc.sendTab to simulate tab execution failure (to force service worker execution)
    const mockIpcSendTab = vi
      .fn()
      .mockResolvedValue(new Error("Tab execution failed"))
    vi.doMock("@/services/ipc", () => ({
      Ipc: {
        sendTab: mockIpcSendTab,
        addListener: vi.fn(),
      },
      ServiceWorkerCommand: {
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
    await import("../service_worker")

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
    // 4. Call execute() from action/serviceWorker with the found command
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
        allowClipboardFallback: false,
        pageUrl: "https://example.com",
      }),
    )
  })
})

describe("Popup Auto-Close Delay", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("PAC-01: should close popups immediately when delay is not set", async () => {
    // Mock WindowStackManager
    const mockGetWindowsToClose = vi
      .fn()
      .mockResolvedValue([{ id: 100, commandId: "test", srcWindowId: 1 }])
    const mockRemoveWindow = vi.fn().mockResolvedValue(undefined)

    vi.doMock("@/services/windowStackManager", () => ({
      WindowStackManager: {
        getWindowsToClose: mockGetWindowsToClose,
        removeWindow: mockRemoveWindow,
      },
    }))

    // Mock closeWindow
    const mockCloseWindow = vi.fn().mockResolvedValue(undefined)
    vi.doMock("@/services/chrome", () => ({
      closeWindow: mockCloseWindow,
      windowExists: vi.fn(),
      getCurrentTab: vi.fn().mockResolvedValue({ id: 1 }),
    }))

    // Mock enhancedSettings to return no delay
    mockEnhancedSettings.getSection.mockResolvedValue({
      windowOption: {
        popupAutoCloseDelay: undefined,
      },
    } as any)

    // Mock Storage
    const mockStorageSet = vi.fn().mockResolvedValue(undefined)
    vi.doMock("@/services/storage", () => ({
      Storage: {
        set: mockStorageSet,
      },
      SESSION_STORAGE_KEY: {
        SELECTION_TEXT: "selectionText",
      },
    }))

    // Clear module cache and re-import
    vi.resetModules()
    await import("../service_worker")

    // Get the registered listener
    const listenerCalls = (chrome.windows.onFocusChanged.addListener as any)
      .mock.calls
    expect(listenerCalls.length).toBeGreaterThan(0)
    const focusChangedListener = listenerCalls[listenerCalls.length - 1][0]

    // Trigger focus change
    await focusChangedListener(200)

    // Wait for async operations
    await vi.runAllTimersAsync()

    // Verify window was closed immediately (no setTimeout)
    expect(mockCloseWindow).toHaveBeenCalledWith(100, "onFocusChanged")
    expect(mockRemoveWindow).toHaveBeenCalledWith(100)
  })

  it("PAC-02: should delay popup close when delay is set", async () => {
    const delay = 1000 // 1 second

    // Mock WindowStackManager
    const mockGetWindowsToClose = vi
      .fn()
      .mockResolvedValue([{ id: 100, commandId: "test", srcWindowId: 1 }])
    const mockRemoveWindow = vi.fn().mockResolvedValue(undefined)

    vi.doMock("@/services/windowStackManager", () => ({
      WindowStackManager: {
        getWindowsToClose: mockGetWindowsToClose,
        removeWindow: mockRemoveWindow,
      },
    }))

    // Mock closeWindow
    const mockCloseWindow = vi.fn().mockResolvedValue(undefined)
    vi.doMock("@/services/chrome", () => ({
      closeWindow: mockCloseWindow,
      windowExists: vi.fn(),
      getCurrentTab: vi.fn().mockResolvedValue({ id: 1 }),
    }))

    // Mock enhancedSettings to return delay
    mockEnhancedSettings.getSection.mockResolvedValue({
      windowOption: {
        popupAutoCloseDelay: delay,
      },
    } as any)

    // Mock Storage
    const mockStorageSet = vi.fn().mockResolvedValue(undefined)
    vi.doMock("@/services/storage", () => ({
      Storage: {
        set: mockStorageSet,
      },
      SESSION_STORAGE_KEY: {
        SELECTION_TEXT: "selectionText",
      },
    }))

    // Clear module cache and re-import
    vi.resetModules()
    await import("../service_worker")

    // Get the registered listener
    const listenerCalls = (chrome.windows.onFocusChanged.addListener as any)
      .mock.calls
    const focusChangedListener = listenerCalls[listenerCalls.length - 1][0]

    // Trigger focus change
    await focusChangedListener(200)

    // Window should not be closed immediately
    expect(mockCloseWindow).not.toHaveBeenCalled()

    // Advance timers by the delay amount
    await vi.advanceTimersByTimeAsync(delay)

    // Now window should be closed
    expect(mockCloseWindow).toHaveBeenCalledWith(100, "onFocusChanged")
    expect(mockRemoveWindow).toHaveBeenCalledWith(100)
  })

  it("PAC-03: should cancel timeout when focus returns before delay", async () => {
    const delay = 1000 // 1 second

    // Mock WindowStackManager - first returns windows to close, then empty array
    const mockGetWindowsToClose = vi
      .fn()
      .mockResolvedValueOnce([{ id: 100, commandId: "test", srcWindowId: 1 }])
      .mockResolvedValueOnce([]) // No windows to close when focus returns
    const mockRemoveWindow = vi.fn().mockResolvedValue(undefined)

    vi.doMock("@/services/windowStackManager", () => ({
      WindowStackManager: {
        getWindowsToClose: mockGetWindowsToClose,
        removeWindow: mockRemoveWindow,
      },
    }))

    // Mock closeWindow
    const mockCloseWindow = vi.fn().mockResolvedValue(undefined)
    vi.doMock("@/services/chrome", () => ({
      closeWindow: mockCloseWindow,
      windowExists: vi.fn(),
      getCurrentTab: vi.fn().mockResolvedValue({ id: 1 }),
    }))

    // Mock enhancedSettings to return delay
    mockEnhancedSettings.getSection.mockResolvedValue({
      windowOption: {
        popupAutoCloseDelay: delay,
      },
    } as any)

    // Mock Storage
    const mockStorageSet = vi.fn().mockResolvedValue(undefined)
    vi.doMock("@/services/storage", () => ({
      Storage: {
        set: mockStorageSet,
      },
      SESSION_STORAGE_KEY: {
        SELECTION_TEXT: "selectionText",
      },
    }))

    // Clear module cache and re-import
    vi.resetModules()
    await import("../service_worker")

    // Get the registered listener
    const listenerCalls = (chrome.windows.onFocusChanged.addListener as any)
      .mock.calls
    const focusChangedListener = listenerCalls[listenerCalls.length - 1][0]

    // Trigger focus change (popup loses focus)
    await focusChangedListener(200)

    // Window should not be closed yet
    expect(mockCloseWindow).not.toHaveBeenCalled()

    // Advance timers only halfway
    await vi.advanceTimersByTimeAsync(delay / 2)

    // Focus returns to popup (no windows to close)
    await focusChangedListener(100)

    // Advance remaining time
    await vi.advanceTimersByTimeAsync(delay / 2 + 100)

    // Window should NOT be closed because timeout was cancelled
    expect(mockCloseWindow).not.toHaveBeenCalled()
    expect(mockRemoveWindow).not.toHaveBeenCalled()
  })
})

const mockGetBrowserEnvironmentParams = () => ({
  browser_brands: "Chromium/141",
  is_webdriver: "false",
})

describe("onInstalled: installed analytics event", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // clearAllMocks keeps implementations, which would leak between tests.
    vi.mocked(chrome.tabs.create).mockReset()
  })

  it("IN-01: sends the installed event when reason is install", async () => {
    const mockSendEvent = vi.fn()
    vi.doMock("@/services/analytics", () => ({
      ANALYTICS_EVENTS,
      getBrowserEnvironmentParams: mockGetBrowserEnvironmentParams,
      toErrorMessageParam: (error: unknown) => String(error),
      sendEvent: mockSendEvent,
      getOrCreateClientId: vi.fn().mockResolvedValue("test-client-id"),
    }))

    vi.resetModules()
    await import("../service_worker")

    const listenerCalls = (chrome.runtime.onInstalled.addListener as any).mock
      .calls
    expect(listenerCalls.length).toBeGreaterThan(0)
    const onInstalledListener = listenerCalls[0][0]

    await onInstalledListener({
      reason: chrome.runtime.OnInstalledReason.INSTALL,
    })

    expect(mockSendEvent).toHaveBeenCalledWith(
      "installed",
      {
        browser_brands: "Chromium/141",
        is_webdriver: "false",
        // chrome.windows.getAll is not mocked, so the count is unknown.
        window_count: -1,
        client_id_ready: "true",
      },
      "ServiceWorker",
    )
  })

  it("IN-02: does not send the installed event when reason is update", async () => {
    const mockSendEvent = vi.fn()
    vi.doMock("@/services/analytics", () => ({
      ANALYTICS_EVENTS,
      getBrowserEnvironmentParams: mockGetBrowserEnvironmentParams,
      toErrorMessageParam: (error: unknown) => String(error),
      sendEvent: mockSendEvent,
      getOrCreateClientId: vi.fn().mockResolvedValue("test-client-id"),
    }))

    vi.resetModules()
    await import("../service_worker")

    const listenerCalls = (chrome.runtime.onInstalled.addListener as any).mock
      .calls
    const onInstalledListener = listenerCalls[0][0]

    await onInstalledListener({
      reason: chrome.runtime.OnInstalledReason.UPDATE,
    })

    expect(mockSendEvent).not.toHaveBeenCalledWith(
      "installed",
      expect.anything(),
      expect.anything(),
    )
  })

  it("IN-03: opens the onboarding page tab when reason is install", async () => {
    vi.doMock("@/services/analytics", () => ({
      ANALYTICS_EVENTS,
      getBrowserEnvironmentParams: mockGetBrowserEnvironmentParams,
      toErrorMessageParam: (error: unknown) => String(error),
      sendEvent: vi.fn(),
      getOrCreateClientId: vi.fn().mockResolvedValue("test-client-id"),
    }))

    vi.resetModules()
    await import("../service_worker")

    const listenerCalls = (chrome.runtime.onInstalled.addListener as any).mock
      .calls
    const onInstalledListener = listenerCalls[0][0]

    await onInstalledListener({
      reason: chrome.runtime.OnInstalledReason.INSTALL,
    })

    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: "src/onboarding_page.html",
    })
  })

  it("IN-04: does not open the onboarding page tab when reason is update", async () => {
    vi.doMock("@/services/analytics", () => ({
      ANALYTICS_EVENTS,
      getBrowserEnvironmentParams: mockGetBrowserEnvironmentParams,
      toErrorMessageParam: (error: unknown) => String(error),
      sendEvent: vi.fn(),
      getOrCreateClientId: vi.fn().mockResolvedValue("test-client-id"),
    }))

    vi.resetModules()
    await import("../service_worker")

    const listenerCalls = (chrome.runtime.onInstalled.addListener as any).mock
      .calls
    const onInstalledListener = listenerCalls[0][0]

    await onInstalledListener({
      reason: chrome.runtime.OnInstalledReason.UPDATE,
    })

    expect(chrome.tabs.create).not.toHaveBeenCalledWith(
      expect.objectContaining({ url: "src/onboarding_page.html" }),
    )
  })
})

describe("onInstalled: onboarding diagnostics (#479)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // clearAllMocks keeps implementations, which would leak between tests.
    vi.mocked(chrome.tabs.create).mockReset()
  })

  // Load service_worker with the given analytics mocks and run its
  // onInstalled listener for a fresh install.
  const runInstall = async (
    mocks: {
      sendEvent?: ReturnType<typeof vi.fn>
      getOrCreateClientId?: ReturnType<typeof vi.fn>
    },
    beforeImport?: () => Promise<void>,
  ) => {
    vi.doMock("@/services/analytics", () => ({
      ANALYTICS_EVENTS,
      getBrowserEnvironmentParams: mockGetBrowserEnvironmentParams,
      toErrorMessageParam: (error: unknown) =>
        error instanceof Error ? error.message : String(error),
      sendEvent: mocks.sendEvent ?? vi.fn(),
      getOrCreateClientId:
        mocks.getOrCreateClientId ??
        vi.fn().mockResolvedValue("test-client-id"),
    }))
    vi.resetModules()
    await beforeImport?.()
    await import("../service_worker")

    const listenerCalls = (chrome.runtime.onInstalled.addListener as any).mock
      .calls
    const onInstalledListener = listenerCalls[listenerCalls.length - 1][0]
    await onInstalledListener({
      reason: chrome.runtime.OnInstalledReason.INSTALL,
    })
  }

  it("IN-05: settles the client_id before sending events or opening the onboarding tab", async () => {
    const order: string[] = []
    const getOrCreateClientId = vi.fn(async () => {
      order.push("client_id")
      return "test-client-id"
    })
    const sendEvent = vi.fn((name: string) => {
      order.push(name)
    })
    vi.mocked(chrome.tabs.create).mockImplementation((async () => {
      order.push("tabs.create")
    }) as any)

    await runInstall({ sendEvent, getOrCreateClientId })

    expect(order.indexOf("client_id")).toBe(0)
    expect(order.indexOf("installed")).toBeGreaterThan(0)
    expect(order.indexOf("tabs.create")).toBeGreaterThan(0)
  })

  it("IN-06: reports a successful onboarding tab creation", async () => {
    const sendEvent = vi.fn()
    vi.mocked(chrome.tabs.create).mockResolvedValue({} as any)

    await runInstall({ sendEvent })

    expect(sendEvent).toHaveBeenCalledWith(
      "onboarding_tab_opened",
      { success: "true" },
      "ServiceWorker",
    )
  })

  it("IN-07: reports a failed onboarding tab creation without failing the initialization", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {})
    const sendEvent = vi.fn()
    vi.mocked(chrome.tabs.create).mockRejectedValue(new Error("No window"))

    await runInstall({ sendEvent })

    expect(sendEvent).toHaveBeenCalledWith(
      "onboarding_tab_opened",
      { success: "false", error_message: "No window" },
      "ServiceWorker",
    )
    expect(sendEvent).not.toHaveBeenCalledWith(
      "install_init_error",
      expect.anything(),
      expect.anything(),
    )

    consoleErrorSpy.mockRestore()
  })

  it("IN-08: reports the failed stage when the install initialization throws", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {})
    const sendEvent = vi.fn()

    await runInstall({ sendEvent }, async () => {
      const { Settings: FreshSettings } =
        await import("@/services/settings/settings")
      vi.mocked(FreshSettings.reset).mockRejectedValueOnce(
        new Error("Sync quota exceeded"),
      )
    })

    expect(sendEvent).toHaveBeenCalledWith(
      "install_init_error",
      { stage: "settings_reset", error_message: "Sync quota exceeded" },
      "ServiceWorker",
    )
    expect(chrome.tabs.create).not.toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })

  it("IN-09: flags the installed event when the client_id could not be settled", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {})
    const sendEvent = vi.fn()
    const getOrCreateClientId = vi
      .fn()
      .mockRejectedValueOnce(new Error("storage error"))
      .mockResolvedValue("test-client-id")

    await runInstall({ sendEvent, getOrCreateClientId })

    expect(sendEvent).toHaveBeenCalledWith(
      "installed",
      expect.objectContaining({ client_id_ready: "false" }),
      "ServiceWorker",
    )
    // The failure is handled in place and the onboarding tab still opens.
    expect(chrome.tabs.create).toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })
})

describe("Uninstall URL (onInstalled)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("UN-01: should set uninstall URL with client_id and version on install", async () => {
    const mockGetOrCreateClientId = vi.fn().mockResolvedValue("test-client-id")
    vi.doMock("@/services/analytics", () => ({
      ANALYTICS_EVENTS,
      getBrowserEnvironmentParams: mockGetBrowserEnvironmentParams,
      toErrorMessageParam: (error: unknown) => String(error),
      sendEvent: vi.fn(),
      getOrCreateClientId: mockGetOrCreateClientId,
    }))

    vi.resetModules()
    await import("../service_worker")

    const listenerCalls = (chrome.runtime.onInstalled.addListener as any).mock
      .calls
    expect(listenerCalls.length).toBeGreaterThan(0)
    const onInstalledListener = listenerCalls[0][0]

    await onInstalledListener({
      reason: chrome.runtime.OnInstalledReason.INSTALL,
    })
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(mockGetOrCreateClientId).toHaveBeenCalled()
    expect(chrome.runtime.setUninstallURL).toHaveBeenCalledWith(
      `${NEW_HUB_URL}/uninstall?client_id=test-client-id&v=${VERSION}`,
    )
  })

  it("UN-02: should fall back to the uninstall URL without client_id when getOrCreateClientId fails, without skipping the rest of initialization", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {})
    const mockGetOrCreateClientId = vi
      .fn()
      .mockRejectedValue(new Error("Quota exceeded"))
    vi.doMock("@/services/analytics", () => ({
      ANALYTICS_EVENTS,
      getBrowserEnvironmentParams: mockGetBrowserEnvironmentParams,
      toErrorMessageParam: (error: unknown) => String(error),
      sendEvent: vi.fn(),
      getOrCreateClientId: mockGetOrCreateClientId,
    }))

    vi.resetModules()
    await import("../service_worker")

    const listenerCalls = (chrome.runtime.onInstalled.addListener as any).mock
      .calls
    const onInstalledListener = listenerCalls[0][0]

    await onInstalledListener({
      reason: chrome.runtime.OnInstalledReason.INSTALL,
    })
    await new Promise((resolve) => setTimeout(resolve, 10))

    // Falls back to the URL without client_id instead of leaving the
    // uninstall URL unset.
    expect(chrome.runtime.setUninstallURL).toHaveBeenCalledWith(
      `${NEW_HUB_URL}/uninstall`,
    )
    // The client_id failure must not propagate to the outer catch, which
    // would otherwise skip the daily/weekly backup checks that follow.
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      "Error during onInstalled initialization:",
      expect.anything(),
    )

    consoleErrorSpy.mockRestore()
  })
})

describe("Window listeners: ServiceWorkerData readiness", () => {
  // Load service_worker with a controllable ServiceWorkerData mock and
  // return the last registered listener for the given window event.
  const setup = async (
    event: "onRemoved" | "onBoundsChanged",
    initialData: Record<string, unknown>,
  ) => {
    let resolveReady!: () => void
    const ready = vi.fn().mockReturnValue(
      new Promise<void>((resolve) => {
        resolveReady = resolve
      }),
    )
    let data = initialData
    const get = vi.fn(() => data)
    const update = vi.fn().mockResolvedValue(true)
    vi.doMock("@/services/serviceWorkerData", () => ({
      ServiceWorkerData: { init: vi.fn(), ready, get, update, set: vi.fn() },
    }))
    vi.doMock("@/services/windowStackManager", () => ({
      WindowStackManager: { getStack: vi.fn().mockResolvedValue([]) },
    }))

    vi.resetModules()
    await import("../service_worker")

    const calls = vi.mocked(chrome.windows[event].addListener).mock.calls
    const listener = calls[calls.length - 1][0] as (
      arg: unknown,
    ) => Promise<void>
    return {
      listener,
      get,
      update,
      resolveReady: (loaded: Record<string, unknown>) => {
        data = loaded
        resolveReady()
      },
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.doUnmock("@/services/serviceWorkerData")
    vi.doUnmock("@/services/windowStackManager")
  })

  it("SWR-01: onRemoved should remove the window using the loaded state", async () => {
    const { listener, get, update, resolveReady } = await setup("onRemoved", {
      normalWindows: [], // Empty default before the state is loaded
    })

    const done = listener(10)
    await Promise.resolve()
    expect(get).not.toHaveBeenCalled()

    const loaded = {
      normalWindows: [
        { id: 10, commandId: "a", srcWindowId: 1 },
        { id: 20, commandId: "b", srcWindowId: 1 },
      ],
    }
    resolveReady(loaded)
    await done

    expect(update).toHaveBeenCalledWith(expect.any(Function))
    const updater = update.mock.calls[0][0]
    expect(updater(loaded)).toEqual({
      normalWindows: [{ id: 20, commandId: "b", srcWindowId: 1 }],
    })
  })

  it("SWR-02: onRemoved should not write when the window is not a normal window", async () => {
    const { listener, update, resolveReady } = await setup("onRemoved", {
      normalWindows: [],
    })

    const done = listener(99)
    resolveReady({
      normalWindows: [{ id: 10, commandId: "a", srcWindowId: 1 }],
    })
    await done

    expect(update).not.toHaveBeenCalled()
  })

  it("SWR-03: onBoundsChanged should read normalWindows only after the state is loaded", async () => {
    const { listener, get, resolveReady } = await setup("onBoundsChanged", {
      normalWindows: [],
    })

    const done = listener({ id: 10, width: 800, height: 600 })
    await Promise.resolve()
    expect(get).not.toHaveBeenCalled()

    resolveReady({ normalWindows: [] })
    await done

    expect(get).toHaveBeenCalled()
  })
})

describe("Side panel optional capability", () => {
  const originalSidePanel = chrome.sidePanel

  beforeEach(() => {
    vi.clearAllMocks()
    // Re-mock explicitly since preceding suites may doUnmock this module.
    vi.doMock("@/services/serviceWorkerData", () => ({
      ServiceWorkerData: {
        init: vi.fn(),
        ready: vi.fn().mockResolvedValue(undefined),
        get: vi.fn(() => ({ normalWindows: [], sidePanelTabs: [] })),
        update: vi.fn().mockResolvedValue(true),
        set: vi.fn(),
      },
    }))
  })

  afterEach(() => {
    setSidePanel(originalSidePanel)
    vi.doUnmock("@/services/serviceWorkerData")
  })

  it("SP-01: registers onOpened/onClosed listeners when side panel API is available", async () => {
    vi.resetModules()
    await import("../service_worker")

    expect(chrome.sidePanel.onOpened.addListener).toHaveBeenCalledTimes(1)
    expect(chrome.sidePanel.onClosed.addListener).toHaveBeenCalledTimes(1)
  })

  it("SP-02: initializes without error when chrome.sidePanel is not available", async () => {
    setSidePanel(undefined)

    vi.resetModules()
    const mod = await import("../service_worker")

    expect(mod.testExports.commandFuncs).toBeDefined()
    // Other listeners must still be registered.
    expect(chrome.runtime.onInstalled.addListener).toHaveBeenCalled()
  })

  it("SP-03: initializes without error when only side panel events are missing", async () => {
    setSidePanel({
      open: vi.fn(),
      setOptions: vi.fn(),
    })

    vi.resetModules()
    const mod = await import("../service_worker")

    expect(mod.testExports.commandFuncs).toBeDefined()
  })
})
