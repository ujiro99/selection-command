import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { usePageZoom } from "../usePageZoom"

const mockIpc = vi.hoisted(() => ({
  getZoom: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
}))

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
    expect(mockIpc.removeListener).toHaveBeenCalledWith("zoomChanged")
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
