import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { Ipc, TabCommand } from "@/services/ipc"
import { BgData } from "@/services/backgroundData"

// Mock dependencies
vi.mock("@/services/ipc")
vi.mock("@/services/backgroundData")

const mockIpc = vi.mocked(Ipc)
const mockBgData = vi.mocked(BgData)

// Mock Chrome APIs
const mockRuntimeConnect = vi.fn()
const mockOnMessage = vi.fn()
const mockPort = {
  onMessage: {
    addListener: vi.fn(),
  },
}

global.chrome = {
  runtime: {
    connect: mockRuntimeConnect,
    onMessage: {
      addListener: mockOnMessage,
    },
  },
} as any

// Mock console methods
const mockConsoleInfo = vi.fn()
const mockConsoleError = vi.fn()
global.console = {
  ...global.console,
  info: mockConsoleInfo,
  error: mockConsoleError,
}

// Mock window.addEventListener
const mockAddEventListener = vi.fn()
Object.defineProperty(global.window, "addEventListener", {
  value: mockAddEventListener,
  writable: true,
})

describe("Connection Service", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mocks
    mockRuntimeConnect.mockReturnValue(mockPort)
    mockIpc.getTabId.mockResolvedValue(123)
    mockBgData.get.mockReturnValue({
      connectedTabs: [],
    } as any)
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe("CN-01: Initial Connection Process", () => {
    it("CN-01-a: should establish initial connection when tab is not connected", async () => {
      // Arrange
      mockBgData.get.mockReturnValue({
        connectedTabs: [], // tab is not connected
      } as any)

      // Act
      await import("@/services/connection")

      // Assert
      expect(mockIpc.getTabId).toHaveBeenCalledOnce()
      expect(mockBgData.get).toHaveBeenCalledOnce()
      expect(mockAddEventListener).toHaveBeenCalledWith(
        "pageshow",
        expect.any(Function),
      )
      expect(mockRuntimeConnect).toHaveBeenCalledWith({
        name: "app",
      })
    })

    it("CN-01-b: should not connect when tab is already connected", async () => {
      // Arrange
      mockBgData.get.mockReturnValue({
        connectedTabs: [123], // tab is already connected
      } as any)

      // Act
      await import("@/services/connection")

      // Assert
      expect(mockIpc.getTabId).toHaveBeenCalledOnce()
      expect(mockBgData.get).toHaveBeenCalledOnce()
      expect(mockRuntimeConnect).not.toHaveBeenCalled()
    })

    it("CN-01-c: should handle undefined bgData gracefully", async () => {
      // Arrange
      mockBgData.get.mockReturnValue(undefined as any)

      // Act
      await import("@/services/connection")

      // Assert
      expect(mockIpc.getTabId).toHaveBeenCalledOnce()
      expect(mockBgData.get).toHaveBeenCalledOnce()
      expect(mockRuntimeConnect).toHaveBeenCalledWith({
        name: "app",
      })
    })
  })

  describe("CN-02: BFCache Handling", () => {
    it("CN-02-a: should reconnect when coming from bfcache", async () => {
      // Arrange
      mockBgData.get.mockReturnValue({
        connectedTabs: [], // not connected initially
      } as any)

      // Act
      await import("@/services/connection")

      // Get the pageshow event listener
      const pageShowListener = mockAddEventListener.mock.calls.find(
        (call) => call[0] === "pageshow",
      )?.[1]

      expect(pageShowListener).toBeDefined()

      // Reset runtime connect mock to track subsequent calls
      mockRuntimeConnect.mockClear()

      // Simulate pageshow event from bfcache
      const bfcacheEvent = { persisted: true } as PageTransitionEvent
      pageShowListener!(bfcacheEvent)

      // Assert
      expect(mockRuntimeConnect).toHaveBeenCalledWith({
        name: "app",
      })
    })

    it("CN-02-b: should not reconnect when not coming from bfcache", async () => {
      // Arrange
      mockBgData.get.mockReturnValue({
        connectedTabs: [],
      } as any)

      // Act
      await import("@/services/connection")

      // Get the pageshow event listener
      const pageShowListener = mockAddEventListener.mock.calls.find(
        (call) => call[0] === "pageshow",
      )?.[1]

      expect(pageShowListener).toBeDefined()

      // Reset runtime connect mock to track subsequent calls
      mockRuntimeConnect.mockClear()

      // Simulate regular pageshow event
      const regularEvent = { persisted: false } as PageTransitionEvent
      pageShowListener!(regularEvent)

      // Assert
      expect(mockRuntimeConnect).not.toHaveBeenCalled()
    })
  })

  describe("CN-03: Connect Function", () => {
    it("CN-03-a: should successfully establish Chrome extension connection", async () => {
      // Arrange
      mockBgData.get.mockReturnValue({
        connectedTabs: [],
      } as any)

      // Act
      await import("@/services/connection")

      // Assert
      expect(mockRuntimeConnect).toHaveBeenCalledWith({
        name: "app",
      })
      expect(mockPort.onMessage.addListener).toHaveBeenCalledWith(
        expect.any(Function),
      )
    })

    it("CN-03-b: should handle connected message properly", async () => {
      // Arrange
      mockBgData.get.mockReturnValue({
        connectedTabs: [],
      } as any)

      // Act
      await import("@/services/connection")

      // Get the message listener
      const messageListener = mockPort.onMessage.addListener.mock.calls[0]?.[0]
      expect(messageListener).toBeDefined()

      // Simulate connected message
      const connectedMessage = { command: TabCommand.connected }
      const result = messageListener(connectedMessage)

      // Assert - connection service handles the message silently (returns undefined)
      expect(result).toBeUndefined()
    })

    it("CN-03-c: should handle connection errors gracefully", async () => {
      // Arrange
      const connectionError = new Error("Connection failed")
      mockRuntimeConnect.mockImplementation(() => {
        throw connectionError
      })
      mockBgData.get.mockReturnValue({
        connectedTabs: [],
      } as any)

      // Act
      await import("@/services/connection")

      // Assert
      expect(mockConsoleError).toHaveBeenCalledWith(
        "Failed to connect to service worker:",
        connectionError,
      )
    })
  })

  describe("CN-04: Ping Response", () => {
    it("CN-04-a: should respond to ping command correctly", async () => {
      // Arrange
      const mockSendResponse = vi.fn()

      // Act
      await import("@/services/connection")

      // Get the onMessage listener
      const onMessageListener = mockOnMessage.mock.calls[0]?.[0]
      expect(onMessageListener).toBeDefined()

      // Simulate ping request
      const pingRequest = { command: TabCommand.ping }
      onMessageListener(pingRequest, undefined, mockSendResponse)

      // Assert
      expect(mockSendResponse).toHaveBeenCalledWith({ ready: true })
    })

    it("CN-04-b: should not respond to non-ping commands", async () => {
      // Arrange
      const mockSendResponse = vi.fn()

      // Act
      await import("@/services/connection")

      // Get the onMessage listener
      const onMessageListener = mockOnMessage.mock.calls[0]?.[0]
      expect(onMessageListener).toBeDefined()

      // Simulate non-ping request
      const otherRequest = { command: "other-command" }
      onMessageListener(otherRequest, undefined, mockSendResponse)

      // Assert
      expect(mockSendResponse).not.toHaveBeenCalled()
    })
  })
})
