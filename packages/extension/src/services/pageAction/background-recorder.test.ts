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

    it("BGD-76: 正常系: POPUPモードでレコーダーウィンドウが開設される", async () => {
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

    it("BGD-77: 正常系: TABモードでレコーダータブが開設される", async () => {
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

    it("BGD-84: 境界値: ウィンドウ作成時にtabsが存在しない場合", async () => {
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

    it("BGD-85: 境界値: senderのtabが存在しない場合", async () => {
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

    it("BGD-78: 正常系: ウィンドウサイズと位置が正しく計算される", async () => {
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

    it("BGD-79: 正常系: recordingTabIdが適切に設定される", async () => {
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

    it("BGD-80: 異常系: Chrome.windows.create でエラーが発生した場合", async () => {
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

    it("BGD-81: 異常系: Chrome.tabs.create でエラーが発生した場合", async () => {
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

    it("BGD-82: 異常系: Storage.get でエラーが発生した場合", async () => {
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

    it("BGD-83: 異常系: Storage.set でエラーが発生した場合", async () => {
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
  })

  describe("closeRecorder() function", () => {
    const mockSender = { tab: { id: 123 } }

    it("BGD-86: 正常系: レコーダータブの終了が成功する", async () => {
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

    it("BGD-87: 正常系: recordingTabIdがundefinedに設定される", async () => {
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

    it("BGD-88: 正常系: タブが削除される", async () => {
      const mockResponse = vi.fn()
      mockStorage.get.mockResolvedValue({ recordingTabId: 456 })
      mockStorage.set.mockResolvedValue(undefined)
      global.chrome.tabs.remove = vi.fn().mockResolvedValue(undefined)

      closeRecorder({}, mockSender as any, mockResponse)
      await vi.runAllTimersAsync()

      expect(global.chrome.tabs.remove).toHaveBeenCalledWith(123) // sender.tab.id
      expect(mockResponse).toHaveBeenCalledWith(true)
    })

    it("BGD-89: 異常系: Storage.set でエラーが発生した場合", async () => {
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

    it("BGD-90: 異常系: 初期化時のStorage.get でエラーが発生した場合", async () => {
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
      it("BGD-91: 正常系: 記録中タブのURL変更でurlChangedフラグが設定される", async () => {
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

      it("BGD-92: 境界値: 記録中ではないタブのURL変更は無視される", async () => {
        const mockContext = { recordingTabId: 123 }
        mockStorage.get.mockResolvedValue(mockContext)

        const changeInfo = { url: "https://newurl.com" }
        const tabInfo = { id: 999 } // Different tab ID

        onTabUpdated(999, changeInfo, tabInfo as any)

        await vi.runAllTimersAsync()

        // Should not update context
        expect(mockStorage.update).not.toHaveBeenCalled()
      })

      it("BGD-93: 境界値: 同じURLへの変更は無視される", async () => {
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
      it("BGD-95: 正常系: 記録中タブが削除された場合recordingTabIdがリセットされる", async () => {
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

      it("BGD-96: 境界値: 記録中ではないタブの削除は無視される", async () => {
        const mockContext = { recordingTabId: 123 }
        mockStorage.get.mockResolvedValue(mockContext)

        onTabRemoved(999, { windowId: 1, isWindowClosing: false }) // Different tab ID

        await vi.runAllTimersAsync()

        // Should not update context
        expect(mockStorage.set).not.toHaveBeenCalled()
      })
    })

    describe("windows.onBoundsChanged listener", () => {
      it("BGD-97: 正常系: 記録中ウィンドウのサイズ変更がIPCで送信される", async () => {
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

      it("BGD-98: 境界値: 記録中ではないウィンドウの変更は無視される", async () => {
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
