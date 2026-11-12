import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  type MockedFunction,
} from "vitest"
import { WindowStackManager } from "../windowStackManager"
import { ServiceWorkerData } from "../serviceWorkerData"
import type { WindowType } from "@/types"

// Mock ServiceWorkerData
vi.mock("../serviceWorkerData")

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
  let mockServiceWorkerDataGet: MockedFunction<typeof ServiceWorkerData.get>
  let mockServiceWorkerDataUpdate: MockedFunction<
    typeof ServiceWorkerData.update
  >

  // Helper functions to reduce repetition
  const createServiceWorkerData = (windowStack: any[] = []) => ({
    windowStack,
    normalWindows: [],
    pageActionStop: false,
    activeTabId: null,
    connectedTabs: [],
    sidePanelTabs: [],
    sidePanelUrls: {},
    revision: 0,
  })

  const expectStackUpdate = (
    expectedStack: any[],
    initialStack: any[] = [],
  ) => {
    expect(mockServiceWorkerDataUpdate).toHaveBeenCalledTimes(1)
    const updateCall = mockServiceWorkerDataUpdate.mock.calls[0][0] as (
      data: any,
    ) => any
    const updatedData = updateCall(createServiceWorkerData(initialStack))
    expect(updatedData.windowStack).toEqual(expectedStack)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockServiceWorkerDataGet = vi.mocked(ServiceWorkerData.get)
    mockServiceWorkerDataUpdate = vi.mocked(ServiceWorkerData.update)

    // Default mock implementation
    mockServiceWorkerDataGet.mockReturnValue(createServiceWorkerData())
    mockServiceWorkerDataUpdate.mockResolvedValue(true)
  })

  describe("Basic Window Operations", () => {
    describe("addWindows", () => {
      it("should add multiple windows to same layer when they have same parent", async () => {
        const parentWindow = createTestWindow(1, "cmd1", 0)
        const childWindow1 = createTestWindow(2, "cmd2", 1)
        const childWindow2 = createTestWindow(3, "cmd3", 1)

        mockServiceWorkerDataGet.mockReturnValue(
          createServiceWorkerData([[parentWindow]]),
        )

        await WindowStackManager.addWindows([
          { window: childWindow1, parentWindowId: 1 },
          { window: childWindow2, parentWindowId: 1 },
        ])

        // Should be called only once since it's a batch operation
        expect(mockServiceWorkerDataUpdate).toHaveBeenCalledTimes(1)
        const updateCall = mockServiceWorkerDataUpdate.mock.calls[0][0] as (
          data: any,
        ) => any
        const updatedData = updateCall(
          createServiceWorkerData([[parentWindow]]),
        )
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

        mockServiceWorkerDataGet.mockReturnValue(
          createServiceWorkerData([[parentWindow1], [parentWindow2]]),
        )

        await WindowStackManager.addWindows([
          { window: childWindow1, parentWindowId: 1 },
          { window: childWindow2, parentWindowId: 2 },
        ])

        expect(mockServiceWorkerDataUpdate).toHaveBeenCalledTimes(1)
        const updateCall = mockServiceWorkerDataUpdate.mock.calls[0][0] as (
          data: any,
        ) => any
        const updatedData = updateCall(
          createServiceWorkerData([[parentWindow1], [parentWindow2]]),
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

        mockServiceWorkerDataGet.mockReturnValue(
          createServiceWorkerData([[parentWindow]]),
        )

        await WindowStackManager.addWindows([
          { window: childWindow1, parentWindowId: 1 },
          { window: childWindow2, parentWindowId: 1 },
          { window: independentWindow }, // No parent
        ])

        expect(mockServiceWorkerDataUpdate).toHaveBeenCalledTimes(1)
        const updateCall = mockServiceWorkerDataUpdate.mock.calls[0][0] as (
          data: any,
        ) => any
        const updatedData = updateCall(
          createServiceWorkerData([[parentWindow]]),
        )
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

        mockServiceWorkerDataGet.mockReturnValue(
          createServiceWorkerData(initialStack),
        )

        await WindowStackManager.removeWindow(2)

        expectStackUpdate([[window1], [window3]], initialStack)
      })

      it("should remove layer when all windows in layer are removed", async () => {
        const window1 = createTestWindow(1, "cmd1", 0)
        const window2 = createTestWindow(2, "cmd2", 1)
        const initialStack = [[window1], [window2]]

        mockServiceWorkerDataGet.mockReturnValue(
          createServiceWorkerData(initialStack),
        )

        await WindowStackManager.removeWindow(2)

        expectStackUpdate([[window1]], initialStack)
      })

      it("should handle removal of non-existent window", async () => {
        const window1 = createTestWindow(1, "cmd1", 0)
        const initialStack = [[window1]]

        mockServiceWorkerDataGet.mockReturnValue(
          createServiceWorkerData(initialStack),
        )

        await WindowStackManager.removeWindow(999)

        // Nothing to remove, so storage is not written
        expect(mockServiceWorkerDataUpdate).not.toHaveBeenCalled()
      })
    })
  })

  describe("Focus Change Detection", () => {
    describe("getWindowsToClose", () => {
      it("should return empty array for same layer focus", async () => {
        const window1 = createTestWindow(1, "cmd1", 0)
        const window2 = createTestWindow(2, "cmd2", 0)

        mockServiceWorkerDataGet.mockReturnValue(
          createServiceWorkerData([[window1, window2]]),
        )

        const result = await WindowStackManager.getWindowsToClose(2)

        expect(result).toEqual([])
      })

      it("should return front layers when focusing back layer", async () => {
        const window1 = createTestWindow(1, "cmd1", 0)
        const window2 = createTestWindow(2, "cmd2", 1)
        const window3 = createTestWindow(3, "cmd3", 2)

        mockServiceWorkerDataGet.mockReturnValue(
          createServiceWorkerData([[window1], [window2], [window3]]),
        )

        const result = await WindowStackManager.getWindowsToClose(1)

        expect(result).toEqual([window2, window3])
      })

      it("should return all windows when focusing outside stack", async () => {
        const window1 = createTestWindow(1, "cmd1", 0)
        const window2 = createTestWindow(2, "cmd2", 1)

        mockServiceWorkerDataGet.mockReturnValue(
          createServiceWorkerData([[window1], [window2]]),
        )

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

        mockServiceWorkerDataGet.mockReturnValue(
          createServiceWorkerData([
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

  describe("Keep Open", () => {
    const keepOpenWindow = (id: number, srcWindowId: number): WindowType => ({
      ...createTestWindow(id, "cmd", srcWindowId),
      keepOpen: true,
    })

    it("should exclude keep open windows when focus leaves the stack", async () => {
      const a = keepOpenWindow(1, 0)
      const b = createTestWindow(2, "cmd", 0)
      mockServiceWorkerDataGet.mockReturnValue(
        createServiceWorkerData([[a, b]]),
      )

      expect(await WindowStackManager.getWindowsToClose(999)).toEqual([b])
    })

    it("should close the parent and leave a keep open child", async () => {
      const parent = createTestWindow(1, "cmd", 0)
      const child = keepOpenWindow(2, 1)
      mockServiceWorkerDataGet.mockReturnValue(
        createServiceWorkerData([[parent], [child]]),
      )

      expect(await WindowStackManager.getWindowsToClose(999)).toEqual([parent])
    })

    it("should exclude keep open windows from layers after the focused one", async () => {
      const parent = createTestWindow(1, "cmd", 0)
      const child = keepOpenWindow(2, 1)
      const sibling = createTestWindow(3, "cmd", 1)
      mockServiceWorkerDataGet.mockReturnValue(
        createServiceWorkerData([[parent], [child, sibling]]),
      )

      expect(await WindowStackManager.getWindowsToClose(1)).toEqual([sibling])
    })

    it("should keep same layer windows when focusing a keep open window", async () => {
      const kept = keepOpenWindow(1, 0)
      const sibling = createTestWindow(2, "cmd", 0)
      mockServiceWorkerDataGet.mockReturnValue(
        createServiceWorkerData([[kept, sibling]]),
      )

      // Windows opened together stay siblings even after one is kept open.
      expect(await WindowStackManager.getWindowsToClose(1)).toEqual([])
    })

    it("should put a later popup from the same source in a new layer", async () => {
      const kept = keepOpenWindow(1, 100)
      const preview1 = createTestWindow(2, "cmd", 100)
      const preview2 = createTestWindow(3, "cmd", 100)

      await WindowStackManager.addWindows([
        { window: preview1, parentWindowId: 100 },
        { window: preview2, parentWindowId: 100 },
      ])

      // Popups opened at once still share their own layer.
      expectStackUpdate([[kept], [preview1, preview2]], [[kept]])
    })

    it("should close a later popup when focusing the keep open window", async () => {
      const kept = keepOpenWindow(1, 100)
      const preview = createTestWindow(2, "cmd", 100)
      mockServiceWorkerDataGet.mockReturnValue(
        createServiceWorkerData([[kept], [preview]]),
      )

      expect(await WindowStackManager.getWindowsToClose(1)).toEqual([preview])
    })

    it("should join the same source layer when it has no keep open window", async () => {
      const preview1 = createTestWindow(2, "cmd", 100)
      const preview2 = createTestWindow(3, "cmd", 100)

      await WindowStackManager.addWindows([
        { window: preview2, parentWindowId: 100 },
      ])

      expectStackUpdate([[preview1, preview2]], [[preview1]])
    })

    it("should put a child after a keep open next layer", async () => {
      const parent = createTestWindow(1, "cmd", 0)
      const keptChild = keepOpenWindow(2, 1)
      const grandChild = createTestWindow(3, "cmd", 2)
      const newChild = createTestWindow(4, "cmd", 1)

      await WindowStackManager.addWindows([
        { window: newChild, parentWindowId: 1 },
      ])

      expectStackUpdate(
        [[parent], [keptChild], [newChild], [grandChild]],
        [[parent], [keptChild], [grandChild]],
      )
    })

    it("should keep children opened at once as siblings after a keep open next layer", async () => {
      const parent = createTestWindow(1, "cmd", 0)
      const keptChild = keepOpenWindow(2, 1)
      const child1 = createTestWindow(3, "cmd", 1)
      const child2 = createTestWindow(4, "cmd", 1)

      await WindowStackManager.addWindows([
        { window: child1, parentWindowId: 1 },
        { window: child2, parentWindowId: 1 },
      ])

      expectStackUpdate(
        [[parent], [keptChild], [child1, child2]],
        [[parent], [keptChild]],
      )
    })

    it("should update only the target window", async () => {
      const a = createTestWindow(1, "cmd", 0)
      const b = createTestWindow(2, "cmd", 1)
      mockServiceWorkerDataGet.mockReturnValue(
        createServiceWorkerData([[a], [b]]),
      )

      await WindowStackManager.setKeepOpen(2, true)

      expectStackUpdate([[a], [{ ...b, keepOpen: true }]], [[a], [b]])
    })

    it("should turn keep open off", async () => {
      const a = keepOpenWindow(1, 0)
      mockServiceWorkerDataGet.mockReturnValue(createServiceWorkerData([[a]]))

      await WindowStackManager.setKeepOpen(1, false)

      expectStackUpdate([[{ ...a, keepOpen: false }]], [[a]])
    })

    it("should not write when keep open is unchanged or the window is missing", async () => {
      mockServiceWorkerDataGet.mockReturnValue(
        createServiceWorkerData([[keepOpenWindow(1, 0)]]),
      )

      await WindowStackManager.setKeepOpen(1, true)
      await WindowStackManager.setKeepOpen(999, true)

      expect(mockServiceWorkerDataUpdate).not.toHaveBeenCalled()
    })

    it("should list the ids of keep open windows", async () => {
      mockServiceWorkerDataGet.mockReturnValue(
        createServiceWorkerData([
          [keepOpenWindow(1, 0), createTestWindow(2, "cmd", 0)],
          [keepOpenWindow(3, 1)],
        ]),
      )

      expect(await WindowStackManager.getKeepOpenIds()).toEqual(new Set([1, 3]))
    })

    it("should find a window in any layer", async () => {
      const a = createTestWindow(1, "cmd", 0)
      const b = createTestWindow(2, "cmd", 1)
      mockServiceWorkerDataGet.mockReturnValue(
        createServiceWorkerData([[a], [b]]),
      )

      expect(await WindowStackManager.findWindow(2)).toEqual(b)
      expect(await WindowStackManager.findWindow(999)).toBeUndefined()
    })

    it("should report the keep open state of a window", async () => {
      mockServiceWorkerDataGet.mockReturnValue(
        createServiceWorkerData([
          [keepOpenWindow(1, 0), createTestWindow(2, "cmd", 0)],
        ]),
      )

      expect(await WindowStackManager.isKeepOpen(1)).toBe(true)
      expect(await WindowStackManager.isKeepOpen(2)).toBe(false)
      expect(await WindowStackManager.isKeepOpen(999)).toBe(false)
    })
  })

  describe("Layer Management", () => {
    describe("getStack", () => {
      it("should return current stack", async () => {
        const window1 = createTestWindow(1, "cmd1", 0)
        const window2 = createTestWindow(2, "cmd2", 1)
        const expectedStack = [[window1], [window2]]

        mockServiceWorkerDataGet.mockReturnValue(
          createServiceWorkerData(expectedStack),
        )

        const result = await WindowStackManager.getStack()

        expect(result).toEqual(expectedStack)
      })
    })

    describe("cleanupEmptyLayers", () => {
      it("should remove empty layers", async () => {
        const window1 = createTestWindow(1, "cmd1", 0)
        const initialStack = [[window1], [], []]

        mockServiceWorkerDataGet.mockReturnValue(
          createServiceWorkerData(initialStack),
        )

        await WindowStackManager.cleanupEmptyLayers()

        expectStackUpdate([[window1]], initialStack)
      })

      it("should not change the stack if no empty layers", async () => {
        const window1 = createTestWindow(1, "cmd1", 0)
        const window2 = createTestWindow(2, "cmd2", 1)
        const initialStack = [[window1], [window2]]

        mockServiceWorkerDataGet.mockReturnValue(
          createServiceWorkerData(initialStack),
        )

        await WindowStackManager.cleanupEmptyLayers()

        expect(mockServiceWorkerDataUpdate).toHaveBeenCalledTimes(1)
        const updateCall = mockServiceWorkerDataUpdate.mock.calls[0][0] as (
          data: any,
        ) => any
        const updatedData = updateCall(createServiceWorkerData(initialStack))
        expect(updatedData.windowStack).toBeUndefined()
      })
    })
  })

  describe("Complex Scenarios", () => {
    it("should handle [A] -> [B] -> [C] focus scenarios", async () => {
      const windowA = createTestWindow(1, "cmdA", 0)
      const windowB = createTestWindow(2, "cmdB", 1)
      const windowC = createTestWindow(3, "cmdC", 2)

      mockServiceWorkerDataGet.mockReturnValue(
        createServiceWorkerData([[windowA], [windowB], [windowC]]),
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

      mockServiceWorkerDataGet.mockReturnValue(
        createServiceWorkerData(initialStack),
      )

      await WindowStackManager.removeWindow(2)

      expectStackUpdate([[windowA], [windowC], [windowD]], initialStack)
    })
  })

  describe("ServiceWorkerData not initialized", () => {
    it("should return empty array when ServiceWorkerData.get() returns undefined", async () => {
      mockServiceWorkerDataGet.mockReturnValue(undefined as any)

      const result = await WindowStackManager.getStack()

      expect(result).toEqual([])
    })

    it("should treat stack as empty when ServiceWorkerData.get() returns undefined on addWindow", async () => {
      mockServiceWorkerDataGet.mockReturnValue(undefined as any)
      const window = createTestWindow(1, "cmd1", 0)

      await WindowStackManager.addWindow(window)

      expectStackUpdate([[window]])
    })
  })

  describe("ServiceWorker Persistence", () => {
    it("should load stack from ServiceWorkerData for read operations", async () => {
      mockServiceWorkerDataGet.mockReturnValue(createServiceWorkerData([]))

      await WindowStackManager.getStack()

      expect(mockServiceWorkerDataGet).toHaveBeenCalledTimes(1)
    })

    it("should update the stack atomically for addWindow", async () => {
      const window = createTestWindow(1, "cmd1", 0)

      await WindowStackManager.addWindow(window)

      expect(mockServiceWorkerDataUpdate).toHaveBeenCalledTimes(1)
    })

    it("should save stack to ServiceWorkerData after modifications", async () => {
      const window = createTestWindow(1, "cmd1", 0)

      await WindowStackManager.addWindow(window)

      expectStackUpdate([[window]])
    })
  })
})
