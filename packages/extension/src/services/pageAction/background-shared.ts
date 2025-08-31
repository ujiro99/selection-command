import { beforeEach, afterEach, vi } from "vitest"
import { setupStorageMocks } from "@/test/setup"

// Mock dependencies
vi.mock("@/services/storage", () => ({
  Storage: {
    get: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    getCommands: vi.fn(),
  },
  SESSION_STORAGE_KEY: {
    PA_RECORDING: "pa_recording",
    PA_CONTEXT: "pa_context",
  },
}))

vi.mock("@/services/ipc", () => ({
  Ipc: {
    ensureConnection: vi.fn(),
    sendTab: vi.fn(),
  },
  TabCommand: {
    execPageAction: "execPageAction",
    sendWindowSize: "sendWindowSize",
  },
}))

vi.mock("@/services/chrome", () => ({
  openPopupWindow: vi.fn(),
  openTab: vi.fn(),
  getCurrentTab: vi.fn(),
}))

vi.mock("@/services/backgroundData", () => ({
  BgData: {
    init: vi.fn(),
    update: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
  },
}))

vi.mock("@/services/pageAction", () => ({
  RunningStatus: {
    updateTab: vi.fn(),
    initTab: vi.fn(),
    clearTab: vi.fn(),
  },
}))

vi.mock("@/services/commandMetrics", () => ({
  incrementCommandExecutionCount: vi.fn(),
}))

vi.mock("@/lib/utils", () => ({
  generateRandomID: vi.fn(() => "test-id"),
  isEmpty: vi.fn(),
  isPageActionCommand: vi.fn(),
  isUrl: vi.fn(),
  isUrlParam: vi.fn(),
  sleep: vi.fn(),
}))

vi.mock("@/const", async () => {
  const actual = await vi.importActual("@/const")
  return {
    ...actual,
    PAGE_ACTION_MAX: 10,
    PAGE_ACTION_TIMEOUT: 1000,
    POPUP_TYPE: {
      NORMAL: "normal",
      POPUP: "popup",
    },
    PAGE_ACTION_CONTROL: {
      start: "start",
      end: "end",
    },
    PAGE_ACTION_OPEN_MODE: {
      TAB: "tab",
      BACKGROUND_TAB: "background_tab",
      POPUP: "popup",
      WINDOW: "window",
    },
    PAGE_ACTION_EXEC_STATE: {
      Start: "Start",
      Doing: "Doing",
      Done: "Done",
      Failed: "Failed",
      Stop: "Stop",
    },
    PAGE_ACTION_EVENT: {
      keyboard: "keyboard",
    },
  }
})

// Import modules after mocking
import { Storage } from "@/services/storage"
import { Ipc } from "@/services/ipc"
import { openPopupWindow, openTab, getCurrentTab } from "@/services/chrome"
import { BgData } from "@/services/backgroundData"
import { RunningStatus } from "@/services/pageAction"
import { incrementCommandExecutionCount } from "@/services/commandMetrics"
import {
  generateRandomID,
  isEmpty,
  isPageActionCommand,
  isUrl,
  isUrlParam,
  sleep,
} from "@/lib/utils"
import { resetLastUrl } from "./background"

// Get references to mocked functions
export const mockStorage = Storage as any
export const mockIpc = Ipc as any
export const mockBgData = BgData as any
export const mockRunningStatus = RunningStatus as any
export const mockOpenPopupWindow = openPopupWindow as any
export const mockOpenTab = openTab as any
export const mockGetCurrentTab = getCurrentTab as any
export const mockIncrementCommandExecutionCount =
  incrementCommandExecutionCount as any
export const mockGenerateRandomID = generateRandomID as any
export const mockIsEmpty = isEmpty as any
export const mockIsPageActionCommand = isPageActionCommand as any
export const mockIsUrl = isUrl as any
export const mockIsUrlParam = isUrlParam as any
export const mockSleep = sleep as any

// Mock console methods
export const mockConsole = {
  error: vi.spyOn(console, "error").mockImplementation(() => {}),
  warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
  debug: vi.spyOn(console, "debug").mockImplementation(() => {}),
}

// Setup and cleanup functions
export const setupBackgroundTestEnvironment = () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    mockConsole.error.mockClear()
    mockConsole.warn.mockClear()
    mockConsole.debug.mockClear()

    // Setup storage mocks
    setupStorageMocks("realistic")

    // Reset default mock implementations
    mockGenerateRandomID.mockReturnValue("test-id")
    mockIsEmpty.mockImplementation((str: string) => !str || str.length === 0)
    mockIsPageActionCommand.mockReturnValue(true)
    mockIsUrl.mockReturnValue(true)
    mockIsUrlParam.mockReturnValue(false)
    mockSleep.mockResolvedValue(undefined)
    mockIncrementCommandExecutionCount.mockResolvedValue(undefined)
    mockIpc.ensureConnection.mockResolvedValue(undefined)
    mockIpc.sendTab.mockResolvedValue({ result: true })
    mockRunningStatus.updateTab.mockResolvedValue(undefined)
    mockRunningStatus.initTab.mockResolvedValue(undefined)
    mockRunningStatus.clearTab.mockResolvedValue(undefined)
    mockBgData.init.mockReturnValue(undefined)
    mockBgData.update.mockResolvedValue(true)
    mockBgData.get.mockReturnValue({ pageActionStop: false })
    mockBgData.set.mockResolvedValue(undefined)

    // Setup Chrome tabs API mocks
    global.chrome.tabs.query = vi.fn()
    global.chrome.tabs.update = vi.fn()
    global.chrome.tabs.create = vi.fn()
    global.chrome.tabs.remove = vi.fn()
    global.chrome.windows.create = vi.fn()

    // Reset lastUrl for onTabUpdated tests
    resetLastUrl()
  })

  afterEach(() => {
    vi.useRealTimers()
  })
}
