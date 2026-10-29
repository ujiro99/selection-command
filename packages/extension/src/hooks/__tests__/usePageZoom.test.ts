import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { usePageZoom } from "../usePageZoom"

const mockIpc = vi.hoisted(() => ({
  getZoom: vi.fn(),
  addListener: vi.fn(),
}))
const mockRemoveListener = vi.hoisted(() => vi.fn())

vi.mock("@/services/ipc", () => ({
  Ipc: mockIpc,
  TabCommand: { zoomChanged: "zoomChanged" },
}))

// Invokes the zoomChanged listener registered by the hook.
const notifyZoomChanged = (zoomFactor: number) => {
  const callback = mockIpc.addListener.mock.calls.at(-1)?.[1]
  act(() => {
    callback({ zoomFactor }, {}, vi.fn())
  })
}

describe("usePageZoom", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIpc.getZoom.mockResolvedValue(0.8)
    mockIpc.addListener.mockReturnValue(mockRemoveListener)
  })

  it("ZOOM-01: 正常系: 有効時はタブのズーム倍率を返す", async () => {
    const { result } = renderHook(() => usePageZoom(true))
    await waitFor(() => expect(result.current).toBe(0.8))
  })

  it("ZOOM-02: 正常系: ズーム変更の通知で倍率が更新される", async () => {
    const { result } = renderHook(() => usePageZoom(true))
    await waitFor(() => expect(result.current).toBe(0.8))

    notifyZoomChanged(1.5)
    expect(result.current).toBe(1.5)
  })

  it("ZOOM-03: 正常系: 無効時は倍率を取得せず 1 を返す", () => {
    const { result } = renderHook(() => usePageZoom(false))
    expect(result.current).toBe(1)
    expect(mockIpc.getZoom).not.toHaveBeenCalled()
    expect(mockIpc.addListener).not.toHaveBeenCalled()
  })

  it("ZOOM-04: 正常系: 有効から無効に切り替えると 1 に戻りリスナーを解除する", async () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => usePageZoom(enabled),
      { initialProps: { enabled: true } },
    )
    await waitFor(() => expect(result.current).toBe(0.8))

    rerender({ enabled: false })
    expect(result.current).toBe(1)
    expect(mockRemoveListener).toHaveBeenCalledTimes(1)
  })

  it("ZOOM-05: 異常系: 倍率の取得に失敗しても 1 を返す", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    mockIpc.getZoom.mockRejectedValue(new Error("no tab"))
    const { result } = renderHook(() => usePageZoom(true))
    await waitFor(() => expect(warn).toHaveBeenCalled())
    expect(result.current).toBe(1)
    warn.mockRestore()
  })

  it("ZOOM-06: 境界値: 0 以下や数値以外の倍率は無視する", async () => {
    mockIpc.getZoom.mockResolvedValue(undefined)
    const { result } = renderHook(() => usePageZoom(true))
    await waitFor(() => expect(mockIpc.getZoom).toHaveBeenCalled())
    expect(result.current).toBe(1)

    notifyZoomChanged(0)
    expect(result.current).toBe(1)
  })
})

describe("usePageZoom on extension pages", () => {
  type Tabs = typeof chrome.tabs
  const tabs = chrome.tabs as Tabs
  let zoomListener: ((info: chrome.tabs.OnZoomChangeInfo) => void) | undefined

  beforeEach(() => {
    vi.clearAllMocks()
    zoomListener = undefined
    tabs.getCurrent = vi.fn().mockResolvedValue({ id: 7 }) as never
    vi.mocked(tabs.getZoom).mockResolvedValue(1.5 as never)
    tabs.onZoomChange.addListener = vi.fn((cb) => {
      zoomListener = cb
    })
    tabs.onZoomChange.removeListener = vi.fn()
  })

  afterEach(() => {
    delete (tabs as Partial<Tabs>).getCurrent
  })

  it("ZOOM-07: 正常系: タブ API で現在のタブのズーム倍率を取得し、IPC は使わない", async () => {
    const { result } = renderHook(() => usePageZoom(true))
    await waitFor(() => expect(result.current).toBe(1.5))
    expect(tabs.getZoom).toHaveBeenCalledWith(7)
    expect(mockIpc.getZoom).not.toHaveBeenCalled()
    expect(mockIpc.addListener).not.toHaveBeenCalled()
  })

  it("ZOOM-08: 正常系: 現在のタブのズーム変更だけを反映する", async () => {
    const { result } = renderHook(() => usePageZoom(true))
    await waitFor(() => expect(result.current).toBe(1.5))

    act(() => zoomListener?.({ tabId: 8, newZoomFactor: 2 } as never))
    expect(result.current).toBe(1.5)
    act(() => zoomListener?.({ tabId: 7, newZoomFactor: 0.8 } as never))
    expect(result.current).toBe(0.8)
  })

  it("ZOOM-09: 正常系: 無効に切り替えるとリスナーを解除する", async () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => usePageZoom(enabled),
      { initialProps: { enabled: true } },
    )
    await waitFor(() => expect(result.current).toBe(1.5))

    rerender({ enabled: false })
    expect(result.current).toBe(1)
    expect(tabs.onZoomChange.removeListener).toHaveBeenCalledWith(zoomListener)
  })
})
