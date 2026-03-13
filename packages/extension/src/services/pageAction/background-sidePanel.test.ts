import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  setupBackgroundTestEnvironment,
  mockStorage,
  mockReadClipboard,
} from "./background-shared"
import {
  handleSidePanelConnect,
  handleSidePanelOpened,
  registerSidePanelTab,
  resetSidePanelState,
} from "./background-sidePanel"

// Setup test environment (applies vi.mock calls from background-shared.ts)
setupBackgroundTestEnvironment()

beforeEach(() => {
  resetSidePanelState()
})

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
const TAB_ID = 42

const createPendingAction = () => ({
  url: PENDING_URL,
  steps: [
    { id: "step-1", param: { type: "input", value: "hello" }, delayMs: 0 },
    { id: "step-end", param: { type: "end" }, delayMs: 0 },
  ],
  selectedText: "test",
  srcUrl: "https://example.com",
  clipboardText: "",
})

// -------------------------------------------------------------------------
// Tests
// -------------------------------------------------------------------------

describe("background.ts - Side Panel Connection", () => {
  describe("handleSidePanelConnect()", () => {
    it("SP-01: Registers a disconnect listener on the port when tabId is queued", async () => {
      const port = createMockPort("https://chatgpt.com")
      mockStorage.get.mockResolvedValue(null)

      registerSidePanelTab(TAB_ID, PENDING_URL)
      await handleSidePanelConnect(port as any)

      expect(port.onDisconnect.addListener).toHaveBeenCalledTimes(1)
    })

    it("SP-02: Clears the retained port when disconnect fires", async () => {
      const port = createMockPort("https://chatgpt.com")
      mockStorage.get.mockResolvedValue(null)

      registerSidePanelTab(TAB_ID, PENDING_URL)
      await handleSidePanelConnect(port as any)

      // Port should be retained; handleSidePanelOpened with no pending action
      // should not throw
      await expect(handleSidePanelOpened()).resolves.toBeUndefined()

      // Simulate disconnect
      const disconnectCallback = port.onDisconnect.addListener.mock.calls[0][0]
      disconnectCallback()

      // After disconnect, handleSidePanelOpened should do nothing (port removed from map)
      // We verify this by checking Storage.get is NOT called a second time
      const getCallCountBefore = mockStorage.get.mock.calls.length
      await handleSidePanelOpened()
      expect(mockStorage.get.mock.calls.length).toBe(getCallCountBefore)
    })

    it("SP-03: Does nothing when port has no origin", async () => {
      const port = createMockPort()
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

    it("SP-12: Does not call readClipboard when useClipboard is false", async () => {
      const port = createMockPort("https://chatgpt.com")
      const pending = { ...createPendingAction(), useClipboard: false }
      mockStorage.get.mockResolvedValue(pending)
      mockStorage.set.mockResolvedValue(undefined)

      await handleSidePanelConnect(port as any)

      expect(mockReadClipboard).not.toHaveBeenCalled()
    })

    it("SP-13: Reads clipboard from background context when useClipboard is true", async () => {
      const port = createMockPort("https://chatgpt.com")
      const pending = {
        ...createPendingAction(),
        useClipboard: true,
        clipboardText: "",
      }
      mockStorage.get.mockResolvedValue(pending)
      mockStorage.set.mockResolvedValue(undefined)
      mockReadClipboard.mockResolvedValue({ clipboardText: "clipboard content" })

      await handleSidePanelConnect(port as any)

      expect(mockReadClipboard).toHaveBeenCalledTimes(1)

      // The step should be posted with the clipboard text from background
      expect(port.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          command: "execPageAction",
          param: expect.objectContaining({
            clipboardText: "clipboard content",
          }),
        }),
      )
    })
  })

  describe("handleSidePanelOpened()", () => {
    it("SP-09: Does nothing when no side panel port is retained (after disconnect)", async () => {
      // Connect a port then simulate disconnect to ensure port is removed from map
      const port = createMockPort("https://chatgpt.com")
      mockStorage.get.mockResolvedValue(null)

      registerSidePanelTab(TAB_ID, PENDING_URL)
      await handleSidePanelConnect(port as any)

      // Simulate disconnect to clear the retained port
      const disconnectCallback = port.onDisconnect.addListener.mock.calls[0][0]
      disconnectCallback()

      // After disconnect, handleSidePanelOpened should do nothing
      vi.clearAllMocks()
      await handleSidePanelOpened()

      expect(mockStorage.get).not.toHaveBeenCalled()
    })

    it("SP-10: Sends navigate step via retained port without clearing storage", async () => {
      const port = createMockPort("https://chatgpt.com")
      mockStorage.get.mockResolvedValueOnce(null) // First call: no pending during connect

      registerSidePanelTab(TAB_ID, PENDING_URL)
      await handleSidePanelConnect(port as any)

      // Now simulate a pending action that arrives after connect
      const pending = createPendingAction()
      mockStorage.get.mockResolvedValue(pending)

      await handleSidePanelOpened()

      // Storage must NOT be cleared — the original steps remain for runPendingSidePanelAction
      expect(mockStorage.set).not.toHaveBeenCalled()

      // A navigate step for the pending URL is sent to trigger a page reload
      expect(port.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          command: "execPageAction",
          param: expect.objectContaining({
            step: expect.objectContaining({
              param: expect.objectContaining({
                type: "navigate",
                url: pending.url,
              }),
            }),
          }),
        }),
      )
    })

    it("SP-11: Sends navigate step even when pending action URL differs from retained port origin", async () => {
      const port = createMockPort("https://chatgpt.com")
      mockStorage.get.mockResolvedValueOnce(null) // No pending during connect

      registerSidePanelTab(TAB_ID, PENDING_URL)
      await handleSidePanelConnect(port as any)

      // Pending action for a different service — navigate should still be sent
      const targetUrl = "https://gemini.google.com"
      mockStorage.get.mockResolvedValue({
        url: targetUrl,
        steps: [{ id: "s", param: { type: "click" }, delayMs: 0 }],
        selectedText: "",
        srcUrl: "",
        clipboardText: "",
      })

      await handleSidePanelOpened()

      // Storage must NOT be cleared
      expect(mockStorage.set).not.toHaveBeenCalled()

      // Navigate step sent to the target URL regardless of origin
      expect(port.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          command: "execPageAction",
          param: expect.objectContaining({
            step: expect.objectContaining({
              param: expect.objectContaining({
                type: "navigate",
                url: targetUrl,
              }),
            }),
          }),
        }),
      )
    })
  })
})
