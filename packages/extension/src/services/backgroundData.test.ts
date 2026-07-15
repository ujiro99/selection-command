import { describe, it, expect, vi, beforeEach } from "vitest"
import { SESSION_STORAGE_KEY } from "@/services/storage/const"

type OnChangedCallback = (val: any) => void

describe("BgData", () => {
  let mockGet: ReturnType<typeof vi.fn>
  let mockSet: ReturnType<typeof vi.fn>
  let mockAddListener: ReturnType<typeof vi.fn>
  let lastOnChanged: OnChangedCallback | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let BgData: any

  beforeEach(async () => {
    vi.resetModules()
    lastOnChanged = undefined

    mockGet = vi.fn().mockResolvedValue({})
    mockSet = vi.fn().mockResolvedValue(true)
    mockAddListener = vi.fn((_key: string, cb: OnChangedCallback) => {
      lastOnChanged = cb
      return vi.fn()
    })

    vi.doMock("@/services/storage", () => ({
      Storage: {
        get: mockGet,
        set: mockSet,
        addListener: mockAddListener,
      },
      SESSION_STORAGE_KEY,
    }))
    ;({ BgData } = await import("./backgroundData"))
  })

  describe("init", () => {
    it("synchronously provides a safe default so get() never returns undefined", () => {
      // Storage.get() has not resolved yet at this point.
      BgData.init()

      const data = BgData.get()

      expect(data).toBeDefined()
      expect(data.windowStack).toEqual([])
      expect(data.activeTabId).toBeNull()
    })

    it("replaces the instance with the persisted state once loaded", async () => {
      mockGet.mockResolvedValue({
        windowStack: [[{ id: 1, commandId: "c", srcWindowId: 0 }]],
        activeTabId: 5,
      })

      BgData.init()
      await BgData.ready()

      expect(BgData.get().windowStack).toEqual([
        [{ id: 1, commandId: "c", srcWindowId: 0 }],
      ])
      expect(BgData.get().activeTabId).toBe(5)
    })

    it("normalizes legacy numeric sidePanelTabs entries into SidePanelTab objects", async () => {
      mockGet.mockResolvedValue({ sidePanelTabs: [1, 2] })

      BgData.init()
      await BgData.ready()

      expect(BgData.get().sidePanelTabs).toEqual([
        { tabId: 1, isLinkCommand: false },
        { tabId: 2, isLinkCommand: false },
      ])
    })

    it("is idempotent and only registers the storage listener once", () => {
      BgData.init()
      BgData.init()
      BgData.init()

      expect(mockAddListener).toHaveBeenCalledTimes(1)
    })
  })

  describe("update", () => {
    it("merges a partial object onto the current instance and persists it", async () => {
      mockGet.mockResolvedValue({})
      BgData.init()
      await BgData.ready()

      await BgData.update({ activeTabId: 42 })

      expect(BgData.get().activeTabId).toBe(42)
      expect(mockSet).toHaveBeenCalledWith(
        SESSION_STORAGE_KEY.BG,
        expect.objectContaining({ activeTabId: 42 }),
      )
    })

    it("supports an updater function that reads the current instance", async () => {
      mockGet.mockResolvedValue({ connectedTabs: [1] })
      BgData.init()
      await BgData.ready()

      await BgData.update((data: any) => ({
        connectedTabs: [...data.connectedTabs, 2],
      }))

      expect(BgData.get().connectedTabs).toEqual([1, 2])
    })

    it("waits for the initial load before applying an update", async () => {
      let resolveGet: (val: unknown) => void = () => {}
      mockGet.mockReturnValue(
        new Promise((resolve) => {
          resolveGet = resolve
        }),
      )

      BgData.init()
      const updatePromise = BgData.update({ activeTabId: 1 })

      // Still pending: the persisted load hasn't resolved yet.
      let settled = false
      updatePromise.then(() => {
        settled = true
      })
      await Promise.resolve()
      await Promise.resolve()
      expect(settled).toBe(false)

      resolveGet({ windowStack: [[{ id: 9, commandId: "c", srcWindowId: 0 }]] })
      await updatePromise

      // The update was applied on top of the loaded state, not the
      // synchronous empty default.
      expect(BgData.get().windowStack).toEqual([
        [{ id: 9, commandId: "c", srcWindowId: 0 }],
      ])
      expect(BgData.get().activeTabId).toBe(1)
    })
  })

  describe("set", () => {
    it("replaces the whole instance and persists it", async () => {
      mockGet.mockResolvedValue({})
      BgData.init()
      await BgData.ready()

      await BgData.set({
        windowStack: [],
        normalWindows: [],
        pageActionStop: true,
        activeTabId: 7,
        connectedTabs: [],
        sidePanelTabs: [],
        sidePanelUrls: {},
      })

      expect(BgData.get().pageActionStop).toBe(true)
      expect(BgData.get().activeTabId).toBe(7)
    })

    it("supports an updater function that returns the full next state", async () => {
      mockGet.mockResolvedValue({ activeTabId: 1 })
      BgData.init()
      await BgData.ready()

      await BgData.set((data: any) => ({ ...data, activeTabId: 2 }))

      expect(BgData.get().activeTabId).toBe(2)
    })
  })

  describe("chrome.storage.onChanged handling", () => {
    it("ignores a stale echo that a newer local update already superseded", async () => {
      mockGet.mockResolvedValue({ windowStack: [] })
      BgData.init()
      await BgData.ready()

      // A local write adds a popup window to the stack (revision advances).
      await BgData.update({
        windowStack: [[{ id: 1, commandId: "c", srcWindowId: 0 }]],
      })
      expect(BgData.get().windowStack).toEqual([
        [{ id: 1, commandId: "c", srcWindowId: 0 }],
      ])

      // A delayed onChanged echo of an older write (e.g. this context's own
      // write that predates the update above) arrives afterwards. Applying
      // it would silently wipe out the windowStack we just added.
      lastOnChanged?.({ windowStack: [], revision: 0 })

      expect(BgData.get().windowStack).toEqual([
        [{ id: 1, commandId: "c", srcWindowId: 0 }],
      ])
    })

    it("applies a newer change (e.g. written by another context)", async () => {
      mockGet.mockResolvedValue({})
      BgData.init()
      await BgData.ready()

      await BgData.update({ activeTabId: 1 })

      lastOnChanged?.({ activeTabId: 99, windowStack: [], revision: 1000 })

      expect(BgData.get().activeTabId).toBe(99)
    })
  })

  describe("watch", () => {
    it("subscribes via Storage.addListener and returns the unsubscribe function", () => {
      const cb = vi.fn()

      const result = BgData.watch(cb)

      expect(mockAddListener).toHaveBeenCalledWith(SESSION_STORAGE_KEY.BG, cb)
      expect(typeof result).toBe("function")
    })
  })
})
