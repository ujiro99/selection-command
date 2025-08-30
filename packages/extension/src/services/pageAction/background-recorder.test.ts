import { describe, it, expect } from "vitest"
import {
  setupBackgroundTestEnvironment,
  mockStorage,
  mockIpc,
  mockGetCurrentTab,
  mockConsole,
} from "./background-shared"

import { POPUP_TYPE, PAGE_ACTION_OPEN_MODE } from "@/const"

// Import functions to test
import {
  openRecorder,
  closeRecorder,
  onTabUpdated,
  onTabRemoved,
  onWindowBoundsChanged,
} from "./background"

describe("background.ts - Recorder Management Operations", () => {
  setupBackgroundTestEnvironment()

  describe("openRecorder() function", () => {
    const mockSender = { tab: { id: 123, windowId: 1, index: 0 } }
    const mockResponse = vi.fn()

    it("BGD-76: Normal case: Recorder window is opened in POPUP mode", async () => {
      const mockParam = {
        startUrl: "https://example.com",
        openMode: PAGE_ACTION_OPEN_MODE.POPUP,
        size: { width: 800, height: 600 },
        screen: { width: 1920, height: 1080, top: 0, left: 0 },
      }

      const mockWindow = {
        tabs: [{ id: 999 }],
      }

      global.chrome.windows.create = vi.fn().mockResolvedValue(mockWindow)
      mockStorage.get.mockResolvedValue({})
      mockStorage.set.mockResolvedValue(undefined)

      const result = openRecorder(
        mockParam as any,
        mockSender as any,
        mockResponse,
      )
      expect(result).toBe(true)

      await vi.runAllTimersAsync()

      expect(global.chrome.windows.create).toHaveBeenCalledWith({
        url: "https://example.com",
        width: 800,
        height: 600,
        top: 240, // (1080 - 600) / 2
        left: 560, // (1920 - 800) / 2
        type: POPUP_TYPE.POPUP,
      })
      expect(mockResponse).toHaveBeenCalledWith(true)
    })

    it("BGD-77: Normal case: Recorder tab is opened in TAB mode", async () => {
      const mockParam = {
        startUrl: "https://example.com",
        openMode: PAGE_ACTION_OPEN_MODE.TAB,
        size: { width: 800, height: 600 },
        screen: { width: 1920, height: 1080, top: 0, left: 0 },
      }

      const mockTab = { id: 888 }
      global.chrome.tabs.create = vi.fn().mockResolvedValue(mockTab)
      mockStorage.get.mockResolvedValue({})
      mockStorage.set.mockResolvedValue(undefined)

      openRecorder(mockParam as any, mockSender as any, mockResponse)
      await vi.runAllTimersAsync()

      expect(global.chrome.tabs.create).toHaveBeenCalledWith({
        url: "https://example.com",
        windowId: 1,
        index: 1, // tab.index + 1
      })
    })

    it("BGD-78: Normal case: Window size and position are calculated correctly", async () => {
      const mockParam = {
        startUrl: "https://example.com",
        openMode: PAGE_ACTION_OPEN_MODE.POPUP,
        size: { width: 1000, height: 700 },
        screen: { width: 1600, height: 900, top: 0, left: 0 },
      }

      const mockWindow = { tabs: [{ id: 999 }] }
      global.chrome.windows.create = vi.fn().mockResolvedValue(mockWindow)
      mockStorage.get.mockResolvedValue({})
      mockStorage.set.mockResolvedValue(undefined)

      openRecorder(mockParam as any, mockSender as any, mockResponse)
      await vi.runAllTimersAsync()

      expect(global.chrome.windows.create).toHaveBeenCalledWith({
        url: "https://example.com",
        width: 1000,
        height: 700,
        top: 100, // (900 - 700) / 2
        left: 300, // (1600 - 1000) / 2
        type: POPUP_TYPE.POPUP,
      })
    })

    it("BGD-79: Normal case: recordingTabId is set appropriately", async () => {
      const mockParam = {
        startUrl: "https://example.com",
        openMode: PAGE_ACTION_OPEN_MODE.POPUP,
        size: { width: 800, height: 600 },
        screen: { width: 1920, height: 1080, top: 0, left: 0 },
      }

      const mockWindow = { tabs: [{ id: 888 }] }
      global.chrome.windows.create = vi.fn().mockResolvedValue(mockWindow)
      mockStorage.get.mockResolvedValue({})

      openRecorder(mockParam as any, mockSender as any, mockResponse)
      await vi.runAllTimersAsync()

      expect(mockStorage.set).toHaveBeenCalledWith(
        "pa_context",
        expect.objectContaining({
          recordingTabId: 888,
        }),
      )
    })

    it("BGD-80: Error case: When Chrome.windows.create error occurs", async () => {
      const mockParam = {
        startUrl: "https://example.com",
        openMode: PAGE_ACTION_OPEN_MODE.POPUP,
        size: { width: 800, height: 600 },
        screen: { width: 1920, height: 1080, top: 0, left: 0 },
      }

      global.chrome.windows.create = vi
        .fn()
        .mockRejectedValue(new Error("Window creation failed"))

      // Create a local response mock with promise tracking
      const localMockResponse = vi.fn()
      let responsePromise: Promise<void>
      let responseResolve: () => void

      // Set up promise to track when response is called
      responsePromise = new Promise((resolve) => {
        responseResolve = resolve
      })

      localMockResponse.mockImplementation((result: boolean) => {
        responseResolve()
        return result
      })

      const result = openRecorder(
        mockParam as any,
        mockSender as any,
        localMockResponse,
      )
      expect(result).toBe(true)

      // Wait for the response to be called
      await responsePromise

      expect(mockConsole.error).toHaveBeenCalledWith(
        "Failed to open the recorder:",
        expect.any(Error),
      )
      expect(localMockResponse).toHaveBeenCalledWith(false)
    }, 10000)

    it("BGD-81: Error case: When Chrome.tabs.create error occurs", async () => {
      const mockParam = {
        startUrl: "https://example.com",
        openMode: PAGE_ACTION_OPEN_MODE.TAB,
        size: { width: 800, height: 600 },
        screen: { width: 1920, height: 1080, top: 0, left: 0 },
      }

      global.chrome.tabs.create = vi
        .fn()
        .mockRejectedValue(new Error("Tab creation failed"))

      openRecorder(mockParam as any, mockSender as any, mockResponse)
      await vi.runAllTimersAsync()

      expect(mockConsole.error).toHaveBeenCalledWith(
        "Failed to open the recorder:",
        expect.any(Error),
      )
      expect(mockResponse).toHaveBeenCalledWith(false)
    })

    it("BGD-82: Error case: When Storage.get error occurs", async () => {
      const mockParam = {
        startUrl: "https://example.com",
        openMode: PAGE_ACTION_OPEN_MODE.TAB,
        size: { width: 800, height: 600 },
        screen: { width: 1920, height: 1080, top: 0, left: 0 },
      }

      mockStorage.get.mockRejectedValue(new Error("Storage error"))

      openRecorder(mockParam as any, mockSender as any, mockResponse)
      await vi.runAllTimersAsync()

      expect(mockConsole.error).toHaveBeenCalledWith(
        "Failed to open the recorder:",
        expect.any(Error),
      )
      expect(mockResponse).toHaveBeenCalledWith(false)
    })

    it("BGD-83: Error case: When Storage.set error occurs", async () => {
      const mockParam = {
        startUrl: "https://example.com",
        openMode: PAGE_ACTION_OPEN_MODE.TAB,
        size: { width: 800, height: 600 },
        screen: { width: 1920, height: 1080, top: 0, left: 0 },
      }

      const mockTab = { id: 888 }
      global.chrome.tabs.create = vi.fn().mockResolvedValue(mockTab)
      mockStorage.get.mockResolvedValue({})
      mockStorage.set.mockRejectedValue(new Error("Storage set error"))

      openRecorder(mockParam as any, mockSender as any, mockResponse)
      await vi.runAllTimersAsync()

      expect(mockConsole.error).toHaveBeenCalledWith(
        "Failed to open the recorder:",
        expect.any(Error),
      )
      expect(mockResponse).toHaveBeenCalledWith(false)
    })

    it("BGD-84: Boundary: When tabs do not exist during window creation", async () => {
      const mockParam = {
        startUrl: "https://example.com",
        openMode: PAGE_ACTION_OPEN_MODE.POPUP,
        size: { width: 800, height: 600 },
        screen: { width: 1920, height: 1080, top: 0, left: 0 },
      }

      const mockWindow = { tabs: null }
      global.chrome.windows.create = vi.fn().mockResolvedValue(mockWindow)

      openRecorder(mockParam as any, mockSender as any, mockResponse)
      await vi.runAllTimersAsync()

      expect(mockConsole.error).toHaveBeenCalledWith(
        "Failed to open the recorder.",
      )
    })

    it("BGD-85: Boundary: When sender tab does not exist", async () => {
      const mockParam = {
        startUrl: "https://example.com",
        openMode: PAGE_ACTION_OPEN_MODE.TAB,
        size: { width: 800, height: 600 },
        screen: { width: 1920, height: 1080, top: 0, left: 0 },
      }

      const mockSenderNoTab = { tab: null }
      const mockCurrentTab = { id: 555, windowId: 2, index: 1 }
      mockGetCurrentTab.mockResolvedValue(mockCurrentTab)
      global.chrome.tabs.create = vi.fn().mockResolvedValue({ id: 777 })
      mockStorage.get.mockResolvedValue({})
      mockStorage.set.mockResolvedValue(undefined)

      openRecorder(mockParam as any, mockSenderNoTab as any, mockResponse)
      await vi.runAllTimersAsync()

      expect(mockGetCurrentTab).toHaveBeenCalled()
      expect(global.chrome.tabs.create).toHaveBeenCalledWith({
        url: "https://example.com",
        windowId: 2,
        index: 2, // currentTab.index + 1
      })
    })
  })

  describe("closeRecorder() function", () => {
    const mockSender = { tab: { id: 123 } }

    it("BGD-86: Normal case: Recorder tab termination succeeds", async () => {
      const mockResponse = vi.fn()
      mockStorage.get.mockResolvedValue({ recordingTabId: 123 })
      mockStorage.set.mockResolvedValue(undefined)
      global.chrome.tabs.remove = vi.fn().mockResolvedValue(undefined)

      const result = closeRecorder({}, mockSender as any, mockResponse)
      expect(result).toBe(true)

      await vi.runAllTimersAsync()

      expect(global.chrome.tabs.remove).toHaveBeenCalledWith(123)
      expect(mockResponse).toHaveBeenCalledWith(true)
    })

    it("BGD-87: Normal case: recordingTabId is set to undefined", async () => {
      const mockResponse = vi.fn()
      const mockContext = { recordingTabId: 123 }
      mockStorage.get.mockResolvedValue(mockContext)

      closeRecorder({}, mockSender as any, mockResponse)
      await vi.runAllTimersAsync()

      expect(mockStorage.set).toHaveBeenCalledWith(
        "pa_context",
        expect.objectContaining({
          recordingTabId: undefined,
        }),
      )
    })

    it("BGD-88: Normal case: Tab is removed", async () => {
      const mockResponse = vi.fn()
      mockStorage.get.mockResolvedValue({ recordingTabId: 456 })
      mockStorage.set.mockResolvedValue(undefined)
      global.chrome.tabs.remove = vi.fn().mockResolvedValue(undefined)

      closeRecorder({}, mockSender as any, mockResponse)
      await vi.runAllTimersAsync()

      expect(global.chrome.tabs.remove).toHaveBeenCalledWith(123) // sender.tab.id
      expect(mockResponse).toHaveBeenCalledWith(true)
    })

    it("BGD-89: Error case: When Storage.set error occurs", async () => {
      const mockResponse = vi.fn()
      mockStorage.get.mockResolvedValue({ recordingTabId: 123 })
      mockStorage.set.mockRejectedValue(new Error("Storage set error"))

      closeRecorder({}, mockSender as any, mockResponse)
      await vi.runAllTimersAsync()

      expect(mockConsole.error).toHaveBeenCalledWith(
        "Failed to close the recorder:",
        expect.any(Error),
      )
      expect(mockResponse).toHaveBeenCalledWith(false)
    })

    it("BGD-90: Error case: When Storage.get error occurs during initialization", async () => {
      const mockResponse = vi.fn()
      mockStorage.get.mockRejectedValue(new Error("Storage get error"))

      closeRecorder({}, mockSender as any, mockResponse)
      await vi.runAllTimersAsync()

      expect(mockConsole.error).toHaveBeenCalledWith(
        "Failed to close the recorder:",
        expect.any(Error),
      )
      expect(mockResponse).toHaveBeenCalledWith(false)
    })
  })

  describe("Chrome event listeners", () => {
    describe("tabs.onUpdated listener", () => {
      it("BGD-91: Normal case: urlChanged flag is set when recording tab URL changes", async () => {
        const mockContext = { recordingTabId: 123 }
        mockStorage.get.mockResolvedValue(mockContext)
        mockStorage.set.mockResolvedValue(undefined)

        // Simulate tabs.onUpdated event
        const changeInfo = { url: "https://newurl.com" }
        const tabInfo = { id: 123 }

        // Call the event handler directly
        onTabUpdated(123, changeInfo, tabInfo as any)

        await vi.runAllTimersAsync()

        expect(mockStorage.update).toHaveBeenCalledWith(
          "pa_context",
          expect.any(Function),
        )
      })

      it("BGD-92: Boundary: URL changes in non-recording tabs are ignored", async () => {
        const mockContext = { recordingTabId: 123 }
        mockStorage.get.mockResolvedValue(mockContext)

        const changeInfo = { url: "https://newurl.com" }
        const tabInfo = { id: 999 } // Different tab ID

        onTabUpdated(999, changeInfo, tabInfo as any)

        await vi.runAllTimersAsync()

        // Should not update context
        expect(mockStorage.update).not.toHaveBeenCalled()
      })

      it("BGD-93: Boundary: Changes to the same URL are ignored", async () => {
        const mockContext = {
          recordingTabId: 123,
        }
        mockStorage.get.mockResolvedValue(mockContext)

        // First call to set lastUrl
        const changeInfo1 = { url: "https://example.com" }
        const tabInfo = { id: 123 }
        onTabUpdated(123, changeInfo1, tabInfo as any)
        await vi.runAllTimersAsync()

        // Reset mock calls
        mockStorage.update.mockClear()

        // Second call with same URL should be ignored
        const changeInfo2 = { url: "https://example.com" } // Same URL
        onTabUpdated(123, changeInfo2, tabInfo as any)
        await vi.runAllTimersAsync()

        // Should not update context for same URL
        expect(mockStorage.update).not.toHaveBeenCalled()
      })
    })

    describe("tabs.onRemoved listener", () => {
      it("BGD-95: Normal case: recordingTabId is reset when recording tab is removed", async () => {
        const mockContext = { recordingTabId: 123 }
        mockStorage.get.mockResolvedValue(mockContext)
        mockStorage.set.mockResolvedValue(undefined)

        onTabRemoved(123, { windowId: 1, isWindowClosing: false })

        await vi.runAllTimersAsync()

        expect(mockStorage.set).toHaveBeenCalledWith(
          "pa_context",
          expect.objectContaining({
            recordingTabId: undefined,
          }),
        )
      })

      it("BGD-96: Boundary: Removal of non-recording tabs is ignored", async () => {
        const mockContext = { recordingTabId: 123 }
        mockStorage.get.mockResolvedValue(mockContext)

        onTabRemoved(999, { windowId: 1, isWindowClosing: false }) // Different tab ID

        await vi.runAllTimersAsync()

        // Should not update context
        expect(mockStorage.set).not.toHaveBeenCalled()
      })
    })

    describe("windows.onBoundsChanged listener", () => {
      it("BGD-97: Normal case: Recording window size changes are sent via IPC", async () => {
        const mockContext = { recordingTabId: 123 }
        mockStorage.get.mockResolvedValue(mockContext)
        mockIpc.sendTab.mockResolvedValue(undefined)
        global.chrome.tabs.query = vi.fn().mockResolvedValue([{ id: 123 }])

        const windowInfo = {
          id: 1,
          width: 1200,
          height: 800,
        }

        onWindowBoundsChanged(windowInfo as chrome.windows.Window)

        await vi.runAllTimersAsync()

        expect(mockIpc.sendTab).toHaveBeenCalledWith(
          expect.any(Number),
          "sendWindowSize",
          {
            width: 1200,
            height: 800,
          },
        )
      })

      it("BGD-98: Boundary: Changes to non-recording windows are ignored", async () => {
        const mockContext = { recordingTabId: 123 }
        mockStorage.get.mockResolvedValue(mockContext)
        global.chrome.tabs.query = vi.fn().mockResolvedValue([])

        const windowInfo = {
          id: 999, // Different window ID
          width: 1200,
          height: 800,
        }

        onWindowBoundsChanged(windowInfo as chrome.windows.Window)

        await vi.runAllTimersAsync()

        // Should not send IPC message
        expect(mockIpc.sendTab).not.toHaveBeenCalled()
      })
    })
  })
})
