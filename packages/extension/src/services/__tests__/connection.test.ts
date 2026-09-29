import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { Ipc, TabCommand } from "@/services/ipc"
import { ServiceWorkerData } from "@/services/serviceWorkerData"

// Mock dependencies
vi.mock("@/services/ipc")
vi.mock("@/services/serviceWorkerData")

const mockIpc = vi.mocked(Ipc)
const mockServiceWorkerData = vi.mocked(ServiceWorkerData)

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
    mockServiceWorkerData.ready.mockResolvedValue(undefined)
    mockServiceWorkerData.get.mockReturnValue({
      connectedTabs: [],
    } as any)
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe("CN-01: Initial Connection Process", () => {
    it("CN-01-a: should establish initial connection when tab is not connected", async () => {
      // Arrange
      mockServiceWorkerData.get.mockReturnValue({
        connectedTabs: [], // tab is not connected
      } as any)

      // Act
      await import("@/services/connection")

      // Assert
      expect(mockIpc.getTabId).toHaveBeenCalledOnce()
      expect(mockServiceWorkerData.get).toHaveBeenCalledOnce()
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
      mockServiceWorkerData.get.mockReturnValue({
        connectedTabs: [123], // tab is already connected
      } as any)

      // Act
      await import("@/services/connection")

      // Assert
      expect(mockIpc.getTabId).toHaveBeenCalledOnce()
      expect(mockServiceWorkerData.get).toHaveBeenCalledOnce()
      expect(mockRuntimeConnect).not.toHaveBeenCalled()
    })

    it("CN-01-c: should handle undefined serviceWorkerData gracefully", async () => {
      // Arrange
      mockServiceWorkerData.get.mockReturnValue(undefined as any)

      // Act
      await import("@/services/connection")

      // Assert
      expect(mockIpc.getTabId).toHaveBeenCalledOnce()
      expect(mockServiceWorkerData.get).toHaveBeenCalledOnce()
      expect(mockRuntimeConnect).toHaveBeenCalledWith({
        name: "app",
      })
    })

    it("CN-01-d: should read connectedTabs only after ServiceWorkerData is ready", async () => {
      // Arrange
      let resolveReady!: () => void
      mockServiceWorkerData.ready.mockReturnValue(
        new Promise<void>((resolve) => {
          resolveReady = resolve
        }),
      )
      mockServiceWorkerData.get.mockReturnValue({
        connectedTabs: [123], // tab is already connected
      } as unknown as ServiceWorkerData)

      // Act
      await import("@/services/connection")
      await vi.waitFor(() => {
        expect(mockServiceWorkerData.ready).toHaveBeenCalledOnce()
      })

      // Assert: state is not read until it has been loaded
      expect(mockServiceWorkerData.init).toHaveBeenCalledOnce()
      expect(mockServiceWorkerData.get).not.toHaveBeenCalled()

      resolveReady()
      await vi.waitFor(() => {
        expect(mockServiceWorkerData.get).toHaveBeenCalledOnce()
      })
      expect(mockRuntimeConnect).not.toHaveBeenCalled()
    })

    it("CN-01-e: should log and still connect when ServiceWorkerData fails to load", async () => {
      // Arrange
      const error = new Error("storage error")
      mockServiceWorkerData.ready.mockRejectedValue(error)

      // Act
      await import("@/services/connection")

      // Assert
      await vi.waitFor(() => {
        expect(mockRuntimeConnect).toHaveBeenCalledWith({ name: "app" })
      })
      expect(mockConsoleError).toHaveBeenCalledWith(
        "Failed to load service worker data:",
        error,
      )
    })
  })

  describe("CN-02: BFCache Handling", () => {
    it("CN-02-a: should reconnect when coming from bfcache", async () => {
      // Arrange
      mockServiceWorkerData.get.mockReturnValue({
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
      mockServiceWorkerData.get.mockReturnValue({
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
      mockServiceWorkerData.get.mockReturnValue({
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
      mockServiceWorkerData.get.mockReturnValue({
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
      mockServiceWorkerData.get.mockReturnValue({
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
