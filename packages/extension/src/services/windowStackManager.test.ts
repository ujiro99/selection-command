import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  type MockedFunction,
} from "vitest"
import { WindowStackManager } from "./windowStackManager"
import { BgData } from "./backgroundData"
import type { WindowType } from "@/types"

// Mock BgData
vi.mock("./backgroundData")

const createTestWindow = (
  id: number, // Chrome window ID
  commandId: string, // Command identifier that opened this window
  srcWindowId: number, // Parent window ID (source window that opened this window)
): WindowType => ({
  id,
  commandId,
  srcWindowId,
})

describe("WindowStackManager", () => {
  let mockBgDataGet: MockedFunction<typeof BgData.get>
  let mockBgDataUpdate: MockedFunction<typeof BgData.update>

  // Helper functions to reduce repetition
  const createBgData = (windowStack: any[] = []) => ({
    windowStack,
    normalWindows: [],
    pageActionStop: false,
    activeScreenId: null,
    connectedTabs: [],
  })

  const expectStackUpdate = (
    expectedStack: any[],
    initialStack: any[] = [],
  ) => {
    expect(mockBgDataUpdate).toHaveBeenCalledTimes(1)
    const updateCall = mockBgDataUpdate.mock.calls[0][0] as (data: any) => any
    const updatedData = updateCall(createBgData(initialStack))
    expect(updatedData.windowStack).toEqual(expectedStack)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockBgDataGet = vi.mocked(BgData.get)
    mockBgDataUpdate = vi.mocked(BgData.update)

    // Default mock implementation
    mockBgDataGet.mockReturnValue(createBgData())
    mockBgDataUpdate.mockResolvedValue(true)
  })

  describe("Basic Window Operations", () => {
    describe("addWindows", () => {
      it("should add multiple windows to same layer when they have same parent", async () => {
        const parentWindow = createTestWindow(1, "cmd1", 0)
        const childWindow1 = createTestWindow(2, "cmd2", 1)
        const childWindow2 = createTestWindow(3, "cmd3", 1)

        mockBgDataGet.mockReturnValue(createBgData([[parentWindow]]))

        await WindowStackManager.addWindows([
          { window: childWindow1, parentWindowId: 1 },
          { window: childWindow2, parentWindowId: 1 },
        ])

        // Should be called only once since it's a batch operation
        expect(mockBgDataUpdate).toHaveBeenCalledTimes(1)
        const updateCall = mockBgDataUpdate.mock.calls[0][0] as (
          data: any,
        ) => any
        const updatedData = updateCall(createBgData([[parentWindow]]))
        expect(updatedData.windowStack).toEqual([
          [parentWindow],
          [childWindow1, childWindow2],
        ])
      })

      it("should add multiple windows to different layers when they have different parents", async () => {
        const parentWindow1 = createTestWindow(1, "cmd1", 0)
        const parentWindow2 = createTestWindow(2, "cmd2", 0)
        const childWindow1 = createTestWindow(3, "cmd3", 1)
        const childWindow2 = createTestWindow(4, "cmd4", 2)

        mockBgDataGet.mockReturnValue(
          createBgData([[parentWindow1], [parentWindow2]]),
        )

        await WindowStackManager.addWindows([
          { window: childWindow1, parentWindowId: 1 },
          { window: childWindow2, parentWindowId: 2 },
        ])

        expect(mockBgDataUpdate).toHaveBeenCalledTimes(1)
        const updateCall = mockBgDataUpdate.mock.calls[0][0] as (
          data: any,
        ) => any
        const updatedData = updateCall(
          createBgData([[parentWindow1], [parentWindow2]]),
        )
        expect(updatedData.windowStack).toEqual([
          [parentWindow1],
          [parentWindow2, childWindow1],
          [childWindow2],
        ])
      })

      it("should handle mixed scenarios: some with parents, some without", async () => {
        const parentWindow = createTestWindow(1, "cmd1", 0)
        const childWindow1 = createTestWindow(2, "cmd2", 1)
        const childWindow2 = createTestWindow(3, "cmd3", 1)
        const independentWindow = createTestWindow(4, "cmd4", 0)

        mockBgDataGet.mockReturnValue(createBgData([[parentWindow]]))

        await WindowStackManager.addWindows([
          { window: childWindow1, parentWindowId: 1 },
          { window: childWindow2, parentWindowId: 1 },
          { window: independentWindow }, // No parent
        ])

        expect(mockBgDataUpdate).toHaveBeenCalledTimes(1)
        const updateCall = mockBgDataUpdate.mock.calls[0][0] as (
          data: any,
        ) => any
        const updatedData = updateCall(createBgData([[parentWindow]]))
        expect(updatedData.windowStack).toEqual([
          [parentWindow],
          [childWindow1, childWindow2],
          [independentWindow],
        ])
      })
    })

    describe("removeWindow", () => {
      it("should remove window from layer with multiple windows", async () => {
        const window1 = createTestWindow(1, "cmd1", 0)
        const window2 = createTestWindow(2, "cmd2", 1)
        const window3 = createTestWindow(3, "cmd3", 1)
        const initialStack = [[window1], [window2, window3]]

        mockBgDataGet.mockReturnValue(createBgData(initialStack))

        await WindowStackManager.removeWindow(2)

        expectStackUpdate([[window1], [window3]], initialStack)
      })

      it("should remove layer when all windows in layer are removed", async () => {
        const window1 = createTestWindow(1, "cmd1", 0)
        const window2 = createTestWindow(2, "cmd2", 1)
        const initialStack = [[window1], [window2]]

        mockBgDataGet.mockReturnValue(createBgData(initialStack))

        await WindowStackManager.removeWindow(2)

        expectStackUpdate([[window1]], initialStack)
      })

      it("should handle removal of non-existent window", async () => {
        const window1 = createTestWindow(1, "cmd1", 0)

        mockBgDataGet.mockReturnValue(createBgData([[window1]]))

        await WindowStackManager.removeWindow(999)

        // Should not update if window not found
        expect(mockBgDataUpdate).not.toHaveBeenCalled()
      })
    })
  })

  describe("Focus Change Detection", () => {
    describe("getWindowsToClose", () => {
      it("should return empty array for same layer focus", async () => {
        const window1 = createTestWindow(1, "cmd1", 0)
        const window2 = createTestWindow(2, "cmd2", 0)

        mockBgDataGet.mockReturnValue(createBgData([[window1, window2]]))

        const result = await WindowStackManager.getWindowsToClose(2)

        expect(result).toEqual([])
      })

      it("should return front layers when focusing back layer", async () => {
        const window1 = createTestWindow(1, "cmd1", 0)
        const window2 = createTestWindow(2, "cmd2", 1)
        const window3 = createTestWindow(3, "cmd3", 2)

        mockBgDataGet.mockReturnValue(
          createBgData([[window1], [window2], [window3]]),
        )

        const result = await WindowStackManager.getWindowsToClose(1)

        expect(result).toEqual([window2, window3])
      })

      it("should return all windows when focusing outside stack", async () => {
        const window1 = createTestWindow(1, "cmd1", 0)
        const window2 = createTestWindow(2, "cmd2", 1)

        mockBgDataGet.mockReturnValue(createBgData([[window1], [window2]]))

        const result = await WindowStackManager.getWindowsToClose(999)

        expect(result).toEqual([window1, window2])
      })

      it("should handle complex layer structure", async () => {
        const windowA = createTestWindow(1, "cmdA", 0)
        const windowB = createTestWindow(2, "cmdB", 1)
        const windowC = createTestWindow(3, "cmdC", 1)
        const windowD = createTestWindow(4, "cmdD", 2)
        const windowE = createTestWindow(5, "cmdE", 4)
        const windowF = createTestWindow(6, "cmdF", 4)

        mockBgDataGet.mockReturnValue(
          createBgData([
            [windowA],
            [windowB, windowC],
            [windowD],
            [windowE, windowF],
          ]),
        )

        // Focus on B should close D, E, F
        const result = await WindowStackManager.getWindowsToClose(2)

        expect(result).toEqual([windowD, windowE, windowF])
      })
    })
  })

  describe("Layer Management", () => {
    describe("getStack", () => {
      it("should return current stack", async () => {
        const window1 = createTestWindow(1, "cmd1", 0)
        const window2 = createTestWindow(2, "cmd2", 1)
        const expectedStack = [[window1], [window2]]

        mockBgDataGet.mockReturnValue(createBgData(expectedStack))

        const result = await WindowStackManager.getStack()

        expect(result).toEqual(expectedStack)
      })
    })

    describe("cleanupEmptyLayers", () => {
      it("should remove empty layers", async () => {
        const window1 = createTestWindow(1, "cmd1", 0)
        const initialStack = [[window1], [], []]

        mockBgDataGet.mockReturnValue(createBgData(initialStack))

        await WindowStackManager.cleanupEmptyLayers()

        expectStackUpdate([[window1]], initialStack)
      })

      it("should not update if no empty layers", async () => {
        const window1 = createTestWindow(1, "cmd1", 0)
        const window2 = createTestWindow(2, "cmd2", 1)

        mockBgDataGet.mockReturnValue(createBgData([[window1], [window2]]))

        await WindowStackManager.cleanupEmptyLayers()

        expect(mockBgDataUpdate).not.toHaveBeenCalled()
      })
    })
  })

  describe("Complex Scenarios", () => {
    it("should handle [A] -> [B] -> [C] focus scenarios", async () => {
      const windowA = createTestWindow(1, "cmdA", 0)
      const windowB = createTestWindow(2, "cmdB", 1)
      const windowC = createTestWindow(3, "cmdC", 2)

      mockBgDataGet.mockReturnValue(
        createBgData([[windowA], [windowB], [windowC]]),
      )

      // C -> A should close B and C
      const result = await WindowStackManager.getWindowsToClose(1)
      expect(result).toEqual([windowB, windowC])

      // B -> C should close nothing (moving forward)
      const result2 = await WindowStackManager.getWindowsToClose(3)
      expect(result2).toEqual([])
    })

    it("should handle manual window removal and focus change combination", async () => {
      const windowA = createTestWindow(1, "cmdA", 0)
      const windowB = createTestWindow(2, "cmdB", 1)
      const windowC = createTestWindow(3, "cmdC", 1)
      const windowD = createTestWindow(4, "cmdD", 2)
      const initialStack = [[windowA], [windowB, windowC], [windowD]]

      mockBgDataGet.mockReturnValue(createBgData(initialStack))

      await WindowStackManager.removeWindow(2)

      expectStackUpdate([[windowA], [windowC], [windowD]], initialStack)
    })
  })

  describe("ServiceWorker Persistence", () => {
    it("should load stack from BgData on each operation", async () => {
      const window = createTestWindow(1, "cmd1", 0)

      await WindowStackManager.addWindow(window)

      expect(mockBgDataGet).toHaveBeenCalledTimes(1)
      expect(mockBgDataUpdate).toHaveBeenCalledTimes(1)
    })

    it("should save stack to BgData after modifications", async () => {
      const window = createTestWindow(1, "cmd1", 0)

      await WindowStackManager.addWindow(window)

      expectStackUpdate([[window]])
    })
  })
})
