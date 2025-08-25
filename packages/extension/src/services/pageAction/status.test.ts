import { beforeEach, describe, it, expect, vi } from "vitest"
import type {
  MultiTabPageActionStatus,
  PageActionStatus,
  PageActionStep,
} from "@/types"
import { PAGE_ACTION_EXEC_STATE as EXEC_STATE } from "@/const"
import { PAGE_ACTION_TIMEOUT as TIMEOUT } from "@/const"

// Mock dependencies
vi.mock("@/services/storage", () => ({
  Storage: {
    get: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
  SESSION_STORAGE_KEY: {
    PA_RUNNING: "pa_running",
  },
}))

// Mock console methods
const mockConsole = {
  warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
  error: vi.spyOn(console, "error").mockImplementation(() => {}),
}

// Import modules after mocking
import { MultiTabRunningStatus, RunningStatus } from "./status"
import { Storage, SESSION_STORAGE_KEY } from "@/services/storage"

// Get reference to mocked Storage
const mockStorage = Storage as any

describe("MultiTabRunningStatus", () => {
  // Test data
  const mockTabId = 123
  const mockSteps: PageActionStep[] = [
    {
      id: "step1",
      delayMs: 0,
      skipRenderWait: false,
      param: {
        type: "click" as any,
        label: "Button 1",
      },
    },
    {
      id: "step2",
      delayMs: 0,
      skipRenderWait: false,
      param: {
        type: "input" as any,
        label: "Text Field",
      },
    },
  ]

  const mockPageActionStatus: PageActionStatus = {
    tabId: mockTabId,
    stepId: "step1",
    results: [
      {
        stepId: "step1",
        type: "click" as any,
        label: "Button 1",
        status: EXEC_STATE.Queue,
        duration: TIMEOUT,
      },
      {
        stepId: "step2",
        type: "input" as any,
        label: "Text Field",
        status: EXEC_STATE.Queue,
        duration: TIMEOUT,
      },
    ],
  }

  const mockMultiStatus: MultiTabPageActionStatus = {
    [mockTabId]: mockPageActionStatus,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockConsole.warn.mockClear()
    mockConsole.error.mockClear()
  })

  describe("initTab", () => {
    it("MT-01: Should initialize tab status with valid steps", async () => {
      mockStorage.get.mockResolvedValue(null)
      mockStorage.set.mockResolvedValue(undefined)

      await MultiTabRunningStatus.initTab(mockTabId, mockSteps)

      expect(mockStorage.get).toHaveBeenCalledWith(
        SESSION_STORAGE_KEY.PA_RUNNING,
      )
      expect(mockStorage.set).toHaveBeenCalledWith(
        SESSION_STORAGE_KEY.PA_RUNNING,
        expect.objectContaining({
          [mockTabId]: expect.objectContaining({
            tabId: mockTabId,
            stepId: "step1",
            results: expect.arrayContaining([
              expect.objectContaining({
                stepId: "step1",
                type: "click" as any,
                label: "Button 1",
                status: EXEC_STATE.Queue,
                duration: TIMEOUT,
              }),
              expect.objectContaining({
                stepId: "step2",
                type: "input" as any,
                label: "Text Field",
                status: EXEC_STATE.Queue,
                duration: TIMEOUT,
              }),
            ]),
          }),
        }),
      )
    })

    it("MT-02: Should add new tab to existing multi-status", async () => {
      const existingTabId = 456
      const existingMultiStatus = {
        [existingTabId]: { ...mockPageActionStatus, tabId: existingTabId },
      }
      mockStorage.get.mockResolvedValue(existingMultiStatus)
      mockStorage.set.mockResolvedValue(undefined)

      await MultiTabRunningStatus.initTab(mockTabId, mockSteps)

      expect(mockStorage.set).toHaveBeenCalledWith(
        SESSION_STORAGE_KEY.PA_RUNNING,
        expect.objectContaining({
          [existingTabId]: expect.objectContaining({ tabId: existingTabId }),
          [mockTabId]: expect.objectContaining({ tabId: mockTabId }),
        }),
      )
    })

    it("MT-03: Should throw error when steps array is empty", async () => {
      await expect(
        MultiTabRunningStatus.initTab(mockTabId, []),
      ).rejects.toThrow("Steps array cannot be empty")
    })

    it("MT-04: Should handle null multi-status from storage", async () => {
      mockStorage.get.mockResolvedValue(null)
      mockStorage.set.mockResolvedValue(undefined)

      await MultiTabRunningStatus.initTab(mockTabId, mockSteps)

      expect(mockStorage.set).toHaveBeenCalledWith(
        SESSION_STORAGE_KEY.PA_RUNNING,
        expect.objectContaining({
          [mockTabId]: expect.any(Object),
        }),
      )
    })
  })

  describe("updateTab", () => {
    it("MT-05: Should update step status successfully", async () => {
      // const updatedStatus = { ...mockMultiStatus }
      mockStorage.update.mockImplementation(
        (_: string, updateFn: (data: any) => any) => {
          const result = updateFn(mockMultiStatus)
          return Promise.resolve(result)
        },
      )

      await MultiTabRunningStatus.updateTab(
        mockTabId,
        "step1",
        EXEC_STATE.Done,
        "Test message",
        500,
      )

      expect(mockStorage.update).toHaveBeenCalledWith(
        SESSION_STORAGE_KEY.PA_RUNNING,
        expect.any(Function),
      )
    })

    it("MT-06: Should handle missing tab gracefully", async () => {
      mockStorage.update.mockImplementation(
        (_: string, updateFn: (data: any) => any) => {
          const result = updateFn({})
          return Promise.resolve(result)
        },
      )

      await MultiTabRunningStatus.updateTab(mockTabId, "step1", EXEC_STATE.Done)

      expect(mockConsole.warn).toHaveBeenCalledWith(
        `Tab ${mockTabId} not found in running status`,
      )
    })

    it("MT-07: Should update specific step and preserve others", async () => {
      mockStorage.update.mockImplementation(
        (_: string, updateFn: (data: any) => any) => {
          const result = updateFn(mockMultiStatus)

          // Verify the update function logic
          const currentMultiStatus = mockMultiStatus
          const currentTabStatus = currentMultiStatus[mockTabId]
          const updatedResults = currentTabStatus.results.map((r) =>
            r.stepId === "step1"
              ? {
                  ...r,
                  status: EXEC_STATE.Done,
                  message: "Updated",
                  duration: 600,
                }
              : r,
          )

          const expectedResult = {
            ...currentMultiStatus,
            [mockTabId]: {
              ...currentTabStatus,
              stepId: "step1",
              results: updatedResults,
            },
          }

          expect(result).toEqual(expectedResult)
          return Promise.resolve(result)
        },
      )

      await MultiTabRunningStatus.updateTab(
        mockTabId,
        "step1",
        EXEC_STATE.Done,
        "Updated",
        600,
      )
    })

    it("MT-08: Should use default duration when not provided", async () => {
      mockStorage.update.mockImplementation(
        (_: string, updateFn: (data: any) => any) => {
          const result = updateFn(mockMultiStatus)
          return Promise.resolve(result)
        },
      )

      await MultiTabRunningStatus.updateTab(
        mockTabId,
        "step1",
        EXEC_STATE.Done,
        "Test message",
      )

      expect(mockStorage.update).toHaveBeenCalledWith(
        SESSION_STORAGE_KEY.PA_RUNNING,
        expect.any(Function),
      )
    })
  })

  describe("getTab", () => {
    it("MT-09: Should return tab status for existing tab", async () => {
      mockStorage.get.mockResolvedValue(mockMultiStatus)

      const result = await MultiTabRunningStatus.getTab(mockTabId)

      expect(result).toEqual(mockPageActionStatus)
      expect(mockStorage.get).toHaveBeenCalledWith(
        SESSION_STORAGE_KEY.PA_RUNNING,
      )
    })

    it("MT-10: Should return null for non-existing tab", async () => {
      mockStorage.get.mockResolvedValue({})

      const result = await MultiTabRunningStatus.getTab(999)

      expect(result).toBeNull()
    })

    it("MT-11: Should return null when storage is empty", async () => {
      mockStorage.get.mockResolvedValue(null)

      const result = await MultiTabRunningStatus.getTab(mockTabId)

      expect(result).toBeNull()
    })

    it("MT-12: Should handle storage errors gracefully", async () => {
      const testError = new Error("Storage error")
      mockStorage.get.mockRejectedValue(testError)

      const result = await MultiTabRunningStatus.getTab(mockTabId)

      expect(result).toBeNull()
      expect(mockConsole.error).toHaveBeenCalledWith(
        "Failed to get tab status:",
        testError,
      )
    })
  })

  describe("getAll", () => {
    it("MT-13: Should return all tab statuses", async () => {
      mockStorage.get.mockResolvedValue(mockMultiStatus)

      const result = await MultiTabRunningStatus.getAll()

      expect(result).toEqual(mockMultiStatus)
      expect(mockStorage.get).toHaveBeenCalledWith(
        SESSION_STORAGE_KEY.PA_RUNNING,
      )
    })

    it("MT-14: Should return empty object when storage is empty", async () => {
      mockStorage.get.mockResolvedValue(null)

      const result = await MultiTabRunningStatus.getAll()

      expect(result).toEqual({})
    })

    it("MT-15: Should handle storage errors gracefully", async () => {
      const testError = new Error("Storage error")
      mockStorage.get.mockRejectedValue(testError)

      const result = await MultiTabRunningStatus.getAll()

      expect(result).toEqual({})
      expect(mockConsole.error).toHaveBeenCalledWith(
        "Failed to get all tab statuses:",
        testError,
      )
    })
  })

  describe("clearTab", () => {
    it("MT-16: Should clear specific tab status", async () => {
      const multiStatusWithMultipleTabs = {
        [mockTabId]: mockPageActionStatus,
        456: { ...mockPageActionStatus, tabId: 456 },
      }

      mockStorage.update.mockImplementation(
        (_: string, updateFn: (data: any) => any) => {
          const result = updateFn(multiStatusWithMultipleTabs)

          // Verify the update function removes the correct tab
          const { [mockTabId]: removed, ...remaining } =
            multiStatusWithMultipleTabs
          expect(result).toEqual(remaining)

          return Promise.resolve(result)
        },
      )

      await MultiTabRunningStatus.clearTab(mockTabId)

      expect(mockStorage.update).toHaveBeenCalledWith(
        SESSION_STORAGE_KEY.PA_RUNNING,
        expect.any(Function),
      )
    })

    it("MT-17: Should handle storage errors during clear", async () => {
      const testError = new Error("Storage error")
      mockStorage.update.mockRejectedValue(testError)

      await MultiTabRunningStatus.clearTab(mockTabId)

      expect(mockConsole.error).toHaveBeenCalledWith(
        "Failed to clear tab status:",
        testError,
      )
    })

    it("MT-18: Should handle clearing non-existing tab", async () => {
      mockStorage.update.mockImplementation(
        (_: string, updateFn: (data: any) => any) => {
          const result = updateFn({})
          expect(result).toEqual({})
          return Promise.resolve(result)
        },
      )

      await MultiTabRunningStatus.clearTab(999)

      expect(mockStorage.update).toHaveBeenCalled()
    })
  })

  describe("clear", () => {
    it("MT-19: Should clear all tab statuses", async () => {
      mockStorage.set.mockResolvedValue(undefined)

      await MultiTabRunningStatus.clear()

      expect(mockStorage.set).toHaveBeenCalledWith(
        SESSION_STORAGE_KEY.PA_RUNNING,
        {},
      )
    })
  })

  describe("subscribe", () => {
    it("MT-20: Should add listener and return cleanup function", () => {
      const mockCallback = vi.fn()
      mockStorage.addListener.mockReturnValue(() => {})
      mockStorage.removeListener.mockReturnValue(() => {})

      const unsubscribe = MultiTabRunningStatus.subscribe(mockCallback)

      expect(mockStorage.addListener).toHaveBeenCalledWith(
        SESSION_STORAGE_KEY.PA_RUNNING,
        mockCallback,
      )
      expect(typeof unsubscribe).toBe("function")

      // Test cleanup function
      unsubscribe()
      expect(mockStorage.removeListener).toHaveBeenCalledWith(
        SESSION_STORAGE_KEY.PA_RUNNING,
        mockCallback,
      )
    })
  })
})

describe("RunningStatus (Single-tab API)", () => {
  const mockTabId = 789
  const mockSteps: PageActionStep[] = [
    {
      id: "step1",
      delayMs: 0,
      skipRenderWait: false,
      param: {
        type: "click" as any,
        label: "Button 1",
      },
    },
  ]

  beforeEach(async () => {
    vi.clearAllMocks()
    mockConsole.warn.mockClear()
    mockConsole.error.mockClear()

    // Reset the internal currentTabId state
    // We need to call clear to reset the currentTabId to null
    await RunningStatus.clear()

    // Clear mocks again after the clear call
    vi.clearAllMocks()
    mockConsole.warn.mockClear()
    mockConsole.error.mockClear()
  })

  describe("init", () => {
    it("ST-01: Should set currentTabId and call MultiTab init", async () => {
      mockStorage.get.mockResolvedValue(null)
      mockStorage.set.mockResolvedValue(undefined)

      await RunningStatus.init(mockTabId, mockSteps)

      expect(mockStorage.get).toHaveBeenCalledWith(
        SESSION_STORAGE_KEY.PA_RUNNING,
      )
      expect(mockStorage.set).toHaveBeenCalledWith(
        SESSION_STORAGE_KEY.PA_RUNNING,
        expect.objectContaining({
          [mockTabId]: expect.objectContaining({
            tabId: mockTabId,
            stepId: "step1",
          }),
        }),
      )
    })
  })

  describe("update", () => {
    it("ST-02: Should update current tab when tab is set", async () => {
      // First initialize to set currentTabId
      mockStorage.get.mockResolvedValue(null)
      mockStorage.set.mockResolvedValue(undefined)
      await RunningStatus.init(mockTabId, mockSteps)

      // Mock update behavior
      mockStorage.update.mockImplementation(
        (_: string, updateFn: (data: any) => any) => {
          const mockStatus = {
            [mockTabId]: {
              tabId: mockTabId,
              stepId: "step1",
              results: [
                {
                  stepId: "step1",
                  type: "click" as any,
                  label: "Button 1",
                  status: EXEC_STATE.Queue,
                  duration: TIMEOUT,
                },
              ],
            },
          }
          const result = updateFn(mockStatus)
          return Promise.resolve(result)
        },
      )

      await RunningStatus.update("step1", EXEC_STATE.Done, "Test message", 500)

      expect(mockStorage.update).toHaveBeenCalledWith(
        SESSION_STORAGE_KEY.PA_RUNNING,
        expect.any(Function),
      )
    })

    it("ST-03: Should warn when no current tab is set", async () => {
      await RunningStatus.update("step1", EXEC_STATE.Done, "Test message")

      expect(mockConsole.warn).toHaveBeenCalledWith(
        "No current tab set for RunningStatus.update",
      )
      expect(mockStorage.update).not.toHaveBeenCalled()
    })
  })

  describe("get", () => {
    it("ST-04: Should return current tab status when tab is set", async () => {
      const expectedStatus: PageActionStatus = {
        tabId: mockTabId,
        stepId: "step1",
        results: [
          {
            stepId: "step1",
            type: "click" as any,
            label: "Button 1",
            status: EXEC_STATE.Queue,
            duration: TIMEOUT,
          },
        ],
      }

      // First initialize to set currentTabId
      mockStorage.get.mockResolvedValue(null)
      mockStorage.set.mockResolvedValue(undefined)
      await RunningStatus.init(mockTabId, mockSteps)

      // Mock getTab behavior
      mockStorage.get.mockResolvedValue({ [mockTabId]: expectedStatus })

      const result = await RunningStatus.get()

      expect(result).toEqual(expectedStatus)
      expect(mockStorage.get).toHaveBeenCalledWith(
        SESSION_STORAGE_KEY.PA_RUNNING,
      )
    })

    it("ST-05: Should return empty status when no current tab", async () => {
      const result = await RunningStatus.get()

      expect(result).toEqual({
        tabId: 0,
        stepId: "",
        results: [],
      })
    })

    it("ST-06: Should return default status when tab status is null", async () => {
      // First initialize to set currentTabId
      mockStorage.get.mockResolvedValue(null)
      mockStorage.set.mockResolvedValue(undefined)
      await RunningStatus.init(mockTabId, mockSteps)

      // Mock getTab returning null
      mockStorage.get.mockResolvedValue({})

      const result = await RunningStatus.get()

      expect(result).toEqual({
        tabId: mockTabId,
        stepId: "",
        results: [],
      })
    })
  })

  describe("clear", () => {
    it("ST-07: Should clear current tab and reset currentTabId", async () => {
      // First initialize to set currentTabId
      mockStorage.get.mockResolvedValue(null)
      mockStorage.set.mockResolvedValue(undefined)
      await RunningStatus.init(mockTabId, mockSteps)

      // Mock clear behavior
      mockStorage.update.mockImplementation(
        (_: string, updateFn: (data: any) => any) => {
          const result = updateFn({ [mockTabId]: {} })
          return Promise.resolve(result)
        },
      )

      await RunningStatus.clear()

      expect(mockStorage.update).toHaveBeenCalledWith(
        SESSION_STORAGE_KEY.PA_RUNNING,
        expect.any(Function),
      )

      // Verify currentTabId is reset by checking update behavior
      await RunningStatus.update("step1", EXEC_STATE.Done)
      expect(mockConsole.warn).toHaveBeenCalledWith(
        "No current tab set for RunningStatus.update",
      )
    })

    it("ST-08: Should handle clear when no current tab is set", async () => {
      await RunningStatus.clear()

      // Should not call storage methods when no current tab
      expect(mockStorage.update).not.toHaveBeenCalled()
    })
  })
})
