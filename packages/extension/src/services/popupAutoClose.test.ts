import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { PopupAutoClose } from "./popupAutoClose"
import { Settings } from "@/services/settings/settings"
import { closeWindow } from "@/services/chrome"
import { WindowStackManager } from "@/services/windowStackManager"

// Mock dependencies
vi.mock("@/services/settings/settings")
vi.mock("@/services/chrome")
vi.mock("@/services/windowStackManager")

const mockSettings = vi.mocked(Settings)
const mockCloseWindow = vi.mocked(closeWindow)
const mockWindowStackManager = vi.mocked(WindowStackManager)

describe("PopupAutoClose", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("cancelTimer", () => {
    it("should cancel pending timer", () => {
      // No error should be thrown even if no timer is set
      expect(() => PopupAutoClose.cancelTimer()).not.toThrow()
    })
  })

  describe("scheduleClose", () => {
    it("should close windows immediately when delay is undefined", async () => {
      const windows = [{ id: 100, commandId: "test", srcWindowId: 1 }]
      
      mockSettings.get.mockResolvedValue({
        popupAutoCloseDelay: undefined,
      } as any)

      await PopupAutoClose.scheduleClose(windows)

      // Should close immediately without waiting for timer
      expect(mockCloseWindow).toHaveBeenCalledWith(100, "onFocusChanged")
      expect(mockWindowStackManager.removeWindow).toHaveBeenCalledWith(100)
    })

    it("should close windows immediately when delay is 0", async () => {
      const windows = [{ id: 100, commandId: "test", srcWindowId: 1 }]
      
      mockSettings.get.mockResolvedValue({
        popupAutoCloseDelay: 0,
      } as any)

      await PopupAutoClose.scheduleClose(windows)

      // Should close immediately without waiting for timer
      expect(mockCloseWindow).toHaveBeenCalledWith(100, "onFocusChanged")
      expect(mockWindowStackManager.removeWindow).toHaveBeenCalledWith(100)
    })

    it("should delay close when delay is set", async () => {
      const delay = 1000
      const windows = [{ id: 100, commandId: "test", srcWindowId: 1 }]
      
      mockSettings.get.mockResolvedValue({
        popupAutoCloseDelay: delay,
      } as any)

      await PopupAutoClose.scheduleClose(windows)

      // Should not close immediately
      expect(mockCloseWindow).not.toHaveBeenCalled()

      // Advance timers
      await vi.advanceTimersByTimeAsync(delay)

      // Should close after delay
      expect(mockCloseWindow).toHaveBeenCalledWith(100, "onFocusChanged")
      expect(mockWindowStackManager.removeWindow).toHaveBeenCalledWith(100)
    })

    it("should close multiple windows", async () => {
      const windows = [
        { id: 100, commandId: "test1", srcWindowId: 1 },
        { id: 101, commandId: "test2", srcWindowId: 1 },
      ]
      
      mockSettings.get.mockResolvedValue({
        popupAutoCloseDelay: undefined,
      } as any)

      await PopupAutoClose.scheduleClose(windows)

      // Should close all windows
      expect(mockCloseWindow).toHaveBeenCalledTimes(2)
      expect(mockCloseWindow).toHaveBeenCalledWith(100, "onFocusChanged")
      expect(mockCloseWindow).toHaveBeenCalledWith(101, "onFocusChanged")
      expect(mockWindowStackManager.removeWindow).toHaveBeenCalledTimes(2)
    })

    it("should do nothing when no windows to close", async () => {
      await PopupAutoClose.scheduleClose([])

      // Should not call Settings.get or closeWindow
      expect(mockSettings.get).not.toHaveBeenCalled()
      expect(mockCloseWindow).not.toHaveBeenCalled()
    })

    it("should cancel existing timer before scheduling new one", async () => {
      const delay = 1000
      const windows1 = [{ id: 100, commandId: "test1", srcWindowId: 1 }]
      const windows2 = [{ id: 101, commandId: "test2", srcWindowId: 1 }]
      
      mockSettings.get.mockResolvedValue({
        popupAutoCloseDelay: delay,
      } as any)

      // Schedule first close
      await PopupAutoClose.scheduleClose(windows1)
      
      // Advance time halfway
      await vi.advanceTimersByTimeAsync(delay / 2)
      
      // Schedule second close (should cancel first)
      await PopupAutoClose.scheduleClose(windows2)
      
      // Advance remaining time
      await vi.advanceTimersByTimeAsync(delay / 2)
      
      // First window should NOT be closed (timer was cancelled)
      expect(mockCloseWindow).not.toHaveBeenCalledWith(100, "onFocusChanged")
      
      // Second window should not be closed yet (only half time passed)
      expect(mockCloseWindow).not.toHaveBeenCalled()
      
      // Advance remaining time for second timer
      await vi.advanceTimersByTimeAsync(delay / 2)
      
      // Now second window should be closed
      expect(mockCloseWindow).toHaveBeenCalledWith(101, "onFocusChanged")
    })
  })
})
