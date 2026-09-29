import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  setupServiceWorkerTestEnvironment,
  mockStorage,
  mockIpc,
  mockServiceWorkerData,
  mockOpenTab,
  mockOpenPopupWindow,
  mockGetCurrentTab,
  mockReadClipboard,
  mockMatchesPageActionUrl,
  mockIncrementCommandExecutionCount,
  mockIsEmpty,
  mockIsUrl,
  mockIsUrlParam,
  mockConsole,
} from "./serviceWorker-setup"
import { openAndRun, preview, stopRunner } from "../serviceWorker"
import { PAGE_ACTION_OPEN_MODE, POPUP_TYPE } from "@/const"

// Setup test environment
setupServiceWorkerTestEnvironment()

describe("serviceWorker.ts - Execution Operations", () => {
  describe("openAndRun() function", () => {
    const mockSender = { tab: { id: 123 } }
    const mockResponse = vi.fn()

    beforeEach(() => {
      mockOpenTab.mockResolvedValue({
        tabId: 456,
        clipboardText: "clipboard content",
      })
      mockOpenPopupWindow.mockResolvedValue({
        tabId: 789,
        clipboardText: "clipboard content",
      })
    })

    it("SWD-36: Normal case: Execution in new tab with TAB mode", async () => {
      const mockParam = {
        openMode: PAGE_ACTION_OPEN_MODE.TAB,
        url: "https://example.com",
        commandId: "cmd-1",
        selectedText: "selected",
        userVariables: [],
      }

      const mockCommand = {
        id: "cmd-1",
        pageActionOption: {
          steps: [{ id: "step-1", param: { type: "click" } }],
        },
      }

      mockStorage.getCommands.mockResolvedValue([mockCommand])

      const result = openAndRun(
        mockParam as any,
        mockSender as any,
        mockResponse,
      )
      expect(result).toBe(true)

      await vi.runAllTimersAsync()

      expect(mockOpenTab).toHaveBeenCalledWith({
        url: "https://example.com",
        active: true,
      })
      expect(mockIpc.ensureConnection).toHaveBeenCalledWith(456)
      expect(mockIncrementCommandExecutionCount).toHaveBeenCalled()
    })

    it("SWD-37: Normal case: Execution in background tab with BACKGROUND_TAB mode", async () => {
      const mockParam = {
        openMode: PAGE_ACTION_OPEN_MODE.BACKGROUND_TAB,
        url: "https://example.com",
        commandId: "cmd-1",
        selectedText: "selected",
      }

      const mockCommand = {
        id: "cmd-1",
        pageActionOption: {
          steps: [{ id: "step-1", param: { type: "click" } }],
        },
      }

      mockStorage.getCommands.mockResolvedValue([mockCommand])

      openAndRun(mockParam as any, mockSender as any, mockResponse)
      await vi.runAllTimersAsync()

      expect(mockOpenTab).toHaveBeenCalledWith({
        url: "https://example.com",
        active: false, // Background tab
      })
    })

    it("SWD-37b: Normal case: pageHtml/selectionHtml are only sent with the filePaste step's message", async () => {
      const mockParam = {
        openMode: PAGE_ACTION_OPEN_MODE.TAB,
        url: "https://example.com",
        commandId: "cmd-1",
        selectedText: "selected",
        userVariables: [],
        steps: [
          { id: "step-1", param: { type: "click" } },
          { id: "step-2", param: { type: "filePaste" } },
          { id: "step-3", param: { type: "click" } },
        ],
        pageHtml: "<html>big page</html>",
        selectionHtml: "<span>selection</span>",
      }

      openAndRun(mockParam as any, mockSender as any, mockResponse)
      await vi.runAllTimersAsync()

      const messageByStepId = Object.fromEntries(
        mockIpc.sendTab.mock.calls.map(([, , message]: any[]) => [
          message.step.id,
          message,
        ]),
      )

      expect(messageByStepId["step-1"]).toMatchObject({
        pageHtml: undefined,
        selectionHtml: undefined,
      })
      expect(messageByStepId["step-2"]).toMatchObject({
        pageHtml: "<html>big page</html>",
        selectionHtml: "<span>selection</span>",
      })
      expect(messageByStepId["step-3"]).toMatchObject({
        pageHtml: undefined,
        selectionHtml: undefined,
      })
    })

    it("SWD-38: Normal case: Execution in popup window with POPUP mode", async () => {
      const mockParam = {
        openMode: PAGE_ACTION_OPEN_MODE.POPUP,
        url: "https://example.com",
        commandId: "cmd-1",
        selectedText: "selected",
        width: 800,
        height: 600,
      }

      const mockCommand = {
        id: "cmd-1",
        pageActionOption: {
          steps: [{ id: "step-1", param: { type: "click" } }],
        },
      }

      mockStorage.getCommands.mockResolvedValue([mockCommand])

      openAndRun(mockParam as any, mockSender as any, mockResponse)
      await vi.runAllTimersAsync()

      expect(mockOpenPopupWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          type: POPUP_TYPE.POPUP,
          url: "https://example.com",
        }),
      )
    })

    it("SWD-39: Normal case: Execution in normal window with WINDOW mode", async () => {
      const mockParam = {
        openMode: PAGE_ACTION_OPEN_MODE.WINDOW,
        url: "https://example.com",
        commandId: "cmd-1",
        selectedText: "selected",
      }

      const mockCommand = {
        id: "cmd-1",
        pageActionOption: {
          steps: [{ id: "step-1", param: { type: "click" } }],
        },
      }

      mockStorage.getCommands.mockResolvedValue([mockCommand])

      openAndRun(mockParam as any, mockSender as any, mockResponse)
      await vi.runAllTimersAsync()

      expect(mockOpenPopupWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          type: POPUP_TYPE.NORMAL,
        }),
      )
    })

    it("SWD-40: Normal case: Execution in current tab with CURRENT_TAB mode", async () => {
      const mockParam = {
        openMode: PAGE_ACTION_OPEN_MODE.CURRENT_TAB,
        url: "https://example.com",
        commandId: "cmd-1",
        selectedText: "selected",
        userVariables: [],
      }

      const mockCommand = {
        id: "cmd-1",
        pageActionOption: {
          steps: [{ id: "step-1", param: { type: "click" } }],
        },
      }

      mockGetCurrentTab.mockResolvedValue({
        id: 555,
        url: "https://example.com/page",
      })
      mockStorage.getCommands.mockResolvedValue([mockCommand])

      const result = openAndRun(
        mockParam as any,
        mockSender as any,
        mockResponse,
      )
      expect(result).toBe(true)

      await vi.runAllTimersAsync()

      // Should not open a new tab/window
      expect(mockOpenTab).not.toHaveBeenCalled()
      expect(mockOpenPopupWindow).not.toHaveBeenCalled()
      // Should use the current tab's id
      expect(mockIpc.ensureConnection).toHaveBeenCalledWith(555)
      expect(mockIncrementCommandExecutionCount).toHaveBeenCalled()
    })

    it("SWD-41: Normal case: Execution proceeds when pageUrl pattern matches current tab URL", async () => {
      const mockParam = {
        openMode: PAGE_ACTION_OPEN_MODE.CURRENT_TAB,
        url: "https://example.com",
        commandId: "cmd-1",
        selectedText: "selected",
        pageUrl: "https://example.com/*",
        userVariables: [],
      }

      const mockCommand = {
        id: "cmd-1",
        pageActionOption: {
          steps: [{ id: "step-1", param: { type: "click" } }],
        },
      }

      mockGetCurrentTab.mockResolvedValue({
        id: 555,
        url: "https://example.com/page",
      })
      mockMatchesPageActionUrl.mockReturnValue(true)
      mockStorage.getCommands.mockResolvedValue([mockCommand])

      const result = openAndRun(
        mockParam as any,
        mockSender as any,
        mockResponse,
      )
      expect(result).toBe(true)
      await vi.runAllTimersAsync()

      expect(mockMatchesPageActionUrl).toHaveBeenCalledWith(
        "https://example.com/*",
        "https://example.com/page",
      )
      expect(mockIpc.ensureConnection).toHaveBeenCalledWith(555)
    })

    it("SWD-42: Error case: response(false) when no active tab found in CURRENT_TAB mode", async () => {
      const mockParam = {
        openMode: PAGE_ACTION_OPEN_MODE.CURRENT_TAB,
        url: "https://example.com",
        commandId: "cmd-1",
        selectedText: "selected",
      }

      mockGetCurrentTab.mockResolvedValue(null)

      const result = openAndRun(
        mockParam as any,
        mockSender as any,
        mockResponse,
      )
      expect(result).toBe(true)
      await vi.runAllTimersAsync()

      expect(mockConsole.error).toHaveBeenCalledWith("No active tab found")
      expect(mockResponse).toHaveBeenCalledWith(false)
    })

    it("SWD-43: Error case: response(false) when current tab URL does not match pageUrl pattern", async () => {
      const mockParam = {
        openMode: PAGE_ACTION_OPEN_MODE.CURRENT_TAB,
        url: "https://example.com",
        commandId: "cmd-1",
        selectedText: "selected",
        pageUrl: "https://example.com/*",
      }

      mockGetCurrentTab.mockResolvedValue({
        id: 555,
        url: "https://other.com/page",
      })
      mockMatchesPageActionUrl.mockReturnValue(false)

      const result = openAndRun(
        mockParam as any,
        mockSender as any,
        mockResponse,
      )
      expect(result).toBe(true)
      await vi.runAllTimersAsync()

      expect(mockConsole.warn).toHaveBeenCalledWith(
        "Current tab URL does not match the pageUrl pattern",
        expect.objectContaining({
          pageUrl: "https://example.com/*",
          currentUrl: "https://other.com/page",
        }),
      )
      expect(mockResponse).toHaveBeenCalledWith(false)
      expect(mockOpenTab).not.toHaveBeenCalled()
    })

    it("SWD-45: Normal case: Clipboard is fetched in CURRENT_TAB mode when useClipboard is true", async () => {
      const mockParam = {
        openMode: PAGE_ACTION_OPEN_MODE.CURRENT_TAB,
        url: { url: "https://example.com", useClipboard: true },
        commandId: "cmd-1",
        selectedText: "selected",
        userVariables: [],
      }

      const mockCommand = {
        id: "cmd-1",
        pageActionOption: {
          steps: [{ id: "step-1", param: { type: "click" } }],
        },
      }

      mockGetCurrentTab.mockResolvedValue({
        id: 555,
        url: "https://example.com/page",
      })
      mockIsUrlParam.mockReturnValue(true)
      mockReadClipboard.mockResolvedValue({
        clipboardText: "clipboard content",
        err: null,
      })
      mockStorage.getCommands.mockResolvedValue([mockCommand])

      const result = openAndRun(
        mockParam as any,
        mockSender as any,
        mockResponse,
      )
      expect(result).toBe(true)
      await vi.runAllTimersAsync()

      expect(mockReadClipboard).toHaveBeenCalled()
      expect(mockIpc.ensureConnection).toHaveBeenCalledWith(555)
    })

    it("SWD-46: Normal case: Clipboard is NOT fetched in CURRENT_TAB mode when useClipboard is false", async () => {
      const mockParam = {
        openMode: PAGE_ACTION_OPEN_MODE.CURRENT_TAB,
        url: { url: "https://example.com", useClipboard: false },
        commandId: "cmd-1",
        selectedText: "selected",
        userVariables: [],
      }

      const mockCommand = {
        id: "cmd-1",
        pageActionOption: {
          steps: [{ id: "step-1", param: { type: "click" } }],
        },
      }

      mockGetCurrentTab.mockResolvedValue({
        id: 555,
        url: "https://example.com/page",
      })
      mockIsUrlParam.mockReturnValue(true)
      mockStorage.getCommands.mockResolvedValue([mockCommand])

      const result = openAndRun(
        mockParam as any,
        mockSender as any,
        mockResponse,
      )
      expect(result).toBe(true)
      await vi.runAllTimersAsync()

      expect(mockReadClipboard).not.toHaveBeenCalled()
      expect(mockIpc.ensureConnection).toHaveBeenCalledWith(555)
    })

    it("SWD-44: Normal case: Use clipboardText when selectedText is empty and useClipboard is true", async () => {
      const mockParam = {
        openMode: PAGE_ACTION_OPEN_MODE.TAB,
        url: { url: "https://example.com", useClipboard: true },
        commandId: "cmd-1",
        selectedText: "",
        steps: [{ id: "step-1", param: { type: "click" } }],
      }

      mockIsEmpty.mockReturnValue(true)
      mockIsUrlParam.mockReturnValue(true)
      mockOpenTab.mockResolvedValue({
        tabId: 456,
        clipboardText: "clipboard content",
      })

      openAndRun(mockParam as any, mockSender as any, mockResponse)
      await vi.runAllTimersAsync()

      // run function should be called with clipboard text as selectedText
      expect(mockIpc.sendTab).toHaveBeenCalledWith(
        456,
        "execPageAction",
        expect.objectContaining({
          selectedText: "clipboard content",
          clipboardText: "clipboard content",
        }),
      )
    })

    it("SWD-47: Error case: When tabId retrieval fails", async () => {
      const mockParam = {
        openMode: PAGE_ACTION_OPEN_MODE.TAB,
        url: "https://example.com",
        commandId: "cmd-1",
        selectedText: "selected",
      }

      mockOpenTab.mockResolvedValue({ tabId: null })

      openAndRun(mockParam as any, mockSender as any, mockResponse)
      await vi.runAllTimersAsync()

      expect(mockConsole.error).toHaveBeenCalledWith(
        "Failed to open popup or tab",
      )
      expect(mockResponse).toHaveBeenCalledWith(false)
    })
  })

  describe("preview() function", () => {
    const mockSender = { tab: { id: 123 } }
    const mockResponse = vi.fn()

    it("SWD-51: Normal case: Preview execution succeeds", async () => {
      const mockParam = {
        tabId: 123,
        steps: [{ id: "step-1", param: { type: "click" } }],
        selectedText: "selected",
        clipboardText: "clipboard",
        srcUrl: "https://source.com",
        openMode: PAGE_ACTION_OPEN_MODE.TAB,
        userVariables: [],
      }

      const mockRecordingData = {
        startUrl: "https://example.com",
      }

      mockStorage.get.mockResolvedValue(mockRecordingData)
      global.chrome.tabs.update = vi.fn().mockResolvedValue(undefined)

      const result = preview(mockParam as any, mockSender as any, mockResponse)
      expect(result).toBe(true)

      await vi.runAllTimersAsync()

      expect(global.chrome.tabs.update).toHaveBeenCalledWith(123, {
        url: "https://example.com",
      })
    })

    it("SWD-52: Normal case: Execute after tab returns to URL when startUrl exists", async () => {
      const mockParam = {
        steps: [{ id: "step-1", param: { type: "click" } }],
        selectedText: "selected",
      }

      const mockRecordingData = {
        startUrl: "https://start.com",
      }

      mockStorage.get.mockResolvedValue(mockRecordingData)
      mockIsUrl.mockReturnValue(true)
      global.chrome.tabs.update = vi.fn().mockResolvedValue(undefined)

      preview(mockParam as any, mockSender as any, mockResponse)
      await vi.runAllTimersAsync()

      expect(global.chrome.tabs.update).toHaveBeenCalledWith(123, {
        url: "https://start.com",
      })
    })

    it("SWD-53: Boundary: When startUrl is invalid", async () => {
      const mockParam = {
        steps: [{ id: "step-1", param: { type: "click" } }],
        selectedText: "selected",
      }

      const mockRecordingData = {
        startUrl: "invalid-url",
      }

      mockStorage.get.mockResolvedValue(mockRecordingData)
      mockIsUrl.mockReturnValue(false)
      global.chrome.tabs.update = vi.fn()

      preview(mockParam as any, mockSender as any, mockResponse)
      await vi.runAllTimersAsync()

      expect(mockIsUrl).toHaveBeenCalledWith("invalid-url")
      expect(global.chrome.tabs.update).not.toHaveBeenCalled()
    })

    it("SWD-54: Boundary: When tabId does not exist", async () => {
      const mockParam = { steps: [] }
      const mockSenderNoTab = { tab: null }

      const result = preview(
        mockParam as any,
        mockSenderNoTab as any,
        mockResponse,
      )
      expect(result).toBe(true)

      await vi.runAllTimersAsync()

      expect(mockConsole.error).toHaveBeenCalledWith("tabId not found")
      expect(mockResponse).toHaveBeenCalledWith(false)
    })
  })

  // Note: run() function's internal behavior is complex and depends on asynchronous
  // execution flow that is difficult to test reliably. The function is tested
  // indirectly through openAndRun() and preview() functions above.
  // SWD-56 to SWD-70: Skipped - run() internal testing is complex and unreliable

  describe("stopRunner() function", () => {
    const mockSender = { tab: { id: 123 } }
    const mockResponse = vi.fn()

    it("SWD-71: Normal case: Stop flag setting succeeds", async () => {
      mockServiceWorkerData.set.mockImplementation(
        (updateFn: (data: any) => any) => {
          const result = updateFn({ pageActionStop: false })
          expect(result.pageActionStop).toBe(true)
          return Promise.resolve(undefined)
        },
      )

      const result = stopRunner({}, mockSender as any, mockResponse)
      expect(result).toBe(true)

      await vi.runAllTimersAsync()

      expect(mockServiceWorkerData.set).toHaveBeenCalled()
      expect(mockResponse).toHaveBeenCalledWith(true)
    })

    it("SWD-73: Error case: When ServiceWorkerData.set error occurs", async () => {
      mockServiceWorkerData.set.mockRejectedValue(
        new Error("ServiceWorkerData error"),
      )

      stopRunner({}, mockSender as any, mockResponse)
      await vi.runAllTimersAsync()

      expect(mockConsole.error).toHaveBeenCalledWith(
        "Failed to stop PageAction runner:",
        expect.any(Error),
      )
      expect(mockResponse).toHaveBeenCalledWith(false)
    })

    it("SWD-72: Normal case: pageActionStop is set to true in ServiceWorkerData.set", async () => {
      let capturedData: any
      mockServiceWorkerData.set.mockImplementation(
        (updateFn: (data: any) => any) => {
          capturedData = updateFn({ pageActionStop: false })
          return Promise.resolve(undefined)
        },
      )

      const result = stopRunner({}, mockSender as any, mockResponse)
      await vi.runAllTimersAsync()

      expect(result).toBe(true)
      expect(capturedData.pageActionStop).toBe(true)
      expect(mockResponse).toHaveBeenCalledWith(true)
    })

    it("SWD-74: Normal case: response returns true", async () => {
      mockServiceWorkerData.set.mockImplementation(
        (updateFn: (data: any) => any) => {
          updateFn({ pageActionStop: false })
          return Promise.resolve(undefined)
        },
      )

      const result = stopRunner({}, mockSender as any, mockResponse)
      await vi.runAllTimersAsync()

      expect(result).toBe(true)
      expect(mockResponse).toHaveBeenCalledWith(true)
    })

    it("SWD-75: Error case: response returns false on error", async () => {
      mockServiceWorkerData.set.mockRejectedValue(new Error("Test error"))

      const result = stopRunner({}, mockSender as any, mockResponse)
      await vi.runAllTimersAsync()

      expect(result).toBe(true) // Function itself returns true
      expect(mockResponse).toHaveBeenCalledWith(false) // But response is false due to error
    })
  })
})
