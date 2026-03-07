import { describe, it, expect, vi } from "vitest"
import {
  setupBackgroundTestEnvironment,
  mockStorage,
} from "./background-shared"
import {
  handleSidePanelConnect,
  handleSidePanelOpened,
} from "./background-sidePanel"

// Setup test environment (applies vi.mock calls from background-shared.ts)
setupBackgroundTestEnvironment()

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------

type MockPort = {
  sender: { origin?: string; tab?: { id?: number } }
  postMessage: ReturnType<typeof vi.fn>
  onMessage: {
    addListener: ReturnType<typeof vi.fn>
    removeListener: ReturnType<typeof vi.fn>
  }
  onDisconnect: {
    addListener: ReturnType<typeof vi.fn>
    removeListener: ReturnType<typeof vi.fn>
  }
}

const createMockPort = (origin?: string): MockPort => ({
  sender: origin ? { origin, tab: undefined } : { tab: { id: 123 } },
  postMessage: vi.fn(),
  onMessage: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
  onDisconnect: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
})

const PENDING_URL = "https://chatgpt.com"

const createPendingAction = () => ({
  url: PENDING_URL,
  steps: [
    { id: "step-1", param: { type: "input", value: "hello" }, delayMs: 0 },
    { id: "step-end", param: { type: "end" }, delayMs: 0 },
  ],
  selectedText: "test",
  srcUrl: "https://example.com",
})

// -------------------------------------------------------------------------
// Tests
// -------------------------------------------------------------------------

describe("background.ts - Side Panel Connection", () => {
  describe("handleSidePanelConnect()", () => {
    it("SP-01: Registers a disconnect listener on the port", async () => {
      const port = createMockPort("https://chatgpt.com")
      mockStorage.get.mockResolvedValue(null)

      await handleSidePanelConnect(port as any)

      expect(port.onDisconnect.addListener).toHaveBeenCalledTimes(1)
    })

    it("SP-02: Clears the retained port when disconnect fires", async () => {
      const port = createMockPort("https://chatgpt.com")
      mockStorage.get.mockResolvedValue(null)

      await handleSidePanelConnect(port as any)

      // Port should be retained; handleSidePanelOpened with no pending action
      // should not throw
      await expect(handleSidePanelOpened()).resolves.toBeUndefined()

      // Simulate disconnect
      const disconnectCallback = port.onDisconnect.addListener.mock.calls[0][0]
      disconnectCallback()

      // After disconnect, handleSidePanelOpened should do nothing (port is null)
      // We verify this by checking Storage.get is NOT called a second time
      const getCallCountBefore = mockStorage.get.mock.calls.length
      await handleSidePanelOpened()
      expect(mockStorage.get.mock.calls.length).toBe(getCallCountBefore)
    })

    it("SP-03: Does nothing when port has no origin", async () => {
      const port = createMockPort() // no origin, has tab.id
      port.sender = {} // no origin, no tab

      await handleSidePanelConnect(port as any)

      // Storage.get should not be called since origin is missing
      expect(mockStorage.get).not.toHaveBeenCalled()
    })

    it("SP-04: Does nothing when there is no pending action in storage", async () => {
      const port = createMockPort("https://chatgpt.com")
      mockStorage.get.mockResolvedValue(null)

      await handleSidePanelConnect(port as any)

      expect(mockStorage.get).toHaveBeenCalledWith("pa_side_panel_pending")
      expect(mockStorage.set).not.toHaveBeenCalled()
      expect(port.postMessage).not.toHaveBeenCalled()
    })

    it("SP-05: Does nothing when pending action has no steps", async () => {
      const port = createMockPort("https://chatgpt.com")
      mockStorage.get.mockResolvedValue({
        url: PENDING_URL,
        steps: [],
        selectedText: "",
        srcUrl: "",
      })

      await handleSidePanelConnect(port as any)

      expect(mockStorage.set).not.toHaveBeenCalled()
      expect(port.postMessage).not.toHaveBeenCalled()
    })

    it("SP-06: Does nothing when pending action URL origin does not match port origin", async () => {
      const port = createMockPort("https://gemini.google.com")
      mockStorage.get.mockResolvedValue(createPendingAction()) // URL is chatgpt.com

      await handleSidePanelConnect(port as any)

      // Origins differ → should not clear storage or run via port
      expect(mockStorage.set).not.toHaveBeenCalled()
      expect(port.postMessage).not.toHaveBeenCalled()
    })

    it("SP-07: Does nothing when pending action URL is malformed", async () => {
      const port = createMockPort("https://chatgpt.com")
      mockStorage.get.mockResolvedValue({
        url: "not-a-valid-url",
        steps: [{ id: "s", param: { type: "click" }, delayMs: 0 }],
        selectedText: "",
        srcUrl: "",
      })

      await handleSidePanelConnect(port as any)

      expect(mockStorage.set).not.toHaveBeenCalled()
      expect(port.postMessage).not.toHaveBeenCalled()
    })

    it("SP-08: Clears storage and posts first step when origins match", async () => {
      const port = createMockPort("https://chatgpt.com")
      const pending = createPendingAction()
      mockStorage.get.mockResolvedValue(pending)
      mockStorage.set.mockResolvedValue(undefined)

      await handleSidePanelConnect(port as any)

      // Pending action should be cleared
      expect(mockStorage.set).toHaveBeenCalledWith(
        "pa_side_panel_pending",
        null,
      )

      // runViaPort posts the first step via the port
      expect(port.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          command: "execPageAction",
          param: expect.objectContaining({
            step: pending.steps[0],
            selectedText: pending.selectedText,
            srcUrl: pending.srcUrl,
          }),
        }),
      )
    })
  })

  describe("handleSidePanelOpened()", () => {
    it("SP-09: Does nothing when no side panel port is retained (after disconnect)", async () => {
      // Connect a port then simulate disconnect to ensure sidePanelPort is null
      const port = createMockPort("https://chatgpt.com")
      mockStorage.get.mockResolvedValue(null)
      await handleSidePanelConnect(port as any)

      // Simulate disconnect to clear the retained port
      const disconnectCallback = port.onDisconnect.addListener.mock.calls[0][0]
      disconnectCallback()

      // After disconnect, handleSidePanelOpened should do nothing
      vi.clearAllMocks()
      await handleSidePanelOpened()

      expect(mockStorage.get).not.toHaveBeenCalled()
    })

    it("SP-10: Runs pending action via retained port when origins match", async () => {
      const port = createMockPort("https://chatgpt.com")
      mockStorage.get.mockResolvedValueOnce(null) // First call: no pending during connect

      await handleSidePanelConnect(port as any)

      // Now simulate a pending action that arrives after connect
      const pending = createPendingAction()
      mockStorage.get.mockResolvedValue(pending)
      mockStorage.set.mockResolvedValue(undefined)

      await handleSidePanelOpened()

      expect(mockStorage.set).toHaveBeenCalledWith(
        "pa_side_panel_pending",
        null,
      )
      expect(port.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          command: "execPageAction",
          param: expect.objectContaining({
            step: pending.steps[0],
          }),
        }),
      )
    })

    it("SP-11: Does nothing when pending action origins do not match retained port", async () => {
      const port = createMockPort("https://chatgpt.com")
      mockStorage.get.mockResolvedValueOnce(null) // No pending during connect

      await handleSidePanelConnect(port as any)

      // Pending action for a different service
      mockStorage.get.mockResolvedValue({
        url: "https://gemini.google.com",
        steps: [{ id: "s", param: { type: "click" }, delayMs: 0 }],
        selectedText: "",
        srcUrl: "",
      })

      await handleSidePanelOpened()

      expect(mockStorage.set).not.toHaveBeenCalled()
      expect(port.postMessage).not.toHaveBeenCalled()
    })
  })
})
