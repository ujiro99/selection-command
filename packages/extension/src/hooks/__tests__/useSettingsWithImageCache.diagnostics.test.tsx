import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { OPEN_MODE } from "@/const"
import type { Command } from "@/types"

vi.mock("../../services/settings/enhancedSettings")
vi.mock("../../services/settings/settingsCache")
vi.mock("@/services/analytics", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/analytics")>()),
  sendEvent: vi.fn(),
}))
vi.mock("@/services/ipc", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/services/ipc")>()
  return { ...original, Ipc: { ...original.Ipc, send: vi.fn() } }
})

Object.defineProperty(window, "location", {
  value: { href: "https://example.com/test" },
  writable: true,
})

const command = {
  id: "diagnostics",
  openMode: OPEN_MODE.POPUP,
  title: "Diagnostics",
  iconUrl: "http://diagnostics.example.com/icon.png",
} as Command

// The hook keeps its answers and reported events per page (module state), so
// each test loads a fresh copy of the modules to start from an empty page.
const load = async () => {
  vi.resetModules()
  const { enhancedSettings } =
    await import("../../services/settings/enhancedSettings")
  const { settingsCache } =
    await import("../../services/settings/settingsCache")
  const { Ipc, IpcTimeoutError } = await import("@/services/ipc")
  const { sendEvent, ANALYTICS_EVENTS } = await import("@/services/analytics")
  const hook = await import("../useSettingsWithImageCache")

  vi.mocked(settingsCache.subscribe).mockImplementation(() => {})
  vi.mocked(settingsCache.unsubscribe).mockImplementation(() => {})
  // Sections are requested in this order: user settings, commands, caches.
  vi.mocked(enhancedSettings.getSection).mockImplementation((async (
    section: string,
  ) =>
    section === "commands"
      ? [command]
      : section === "caches"
        ? { images: {} }
        : { folders: [] }) as typeof enhancedSettings.getSection)

  const render = async () => {
    const rendered = renderHook(() => hook.useSettingsWithImageCache())
    await waitFor(() => expect(rendered.result.current.loading).toBe(false))
    return rendered
  }

  return {
    render,
    send: vi.mocked(Ipc.send),
    sendEvent: vi.mocked(sendEvent),
    IpcTimeoutError,
    ANALYTICS_EVENTS,
    hook,
  }
}

describe("useSettingsWithImageCache diagnostics", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, "warn").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it("USD-01: 正常系: Service Worker への問い合わせにタイムアウトを指定する", async () => {
    // Arrange
    const { render, send, hook } = await load()
    send.mockResolvedValue([false])

    // Act
    await render()

    // Assert
    expect(send).toHaveBeenCalledWith(expect.anything(), expect.any(Array), {
      timeoutMs: hook.ICON_COLOR_TIMEOUT_MS,
    })
  })

  it("USD-02: 正常系: すぐに応答があれば計測イベントを送信しない", async () => {
    // Arrange
    const { render, send, sendEvent } = await load()
    send.mockResolvedValue([false])

    // Act
    await render()

    // Assert
    expect(sendEvent).not.toHaveBeenCalled()
  })

  it("USD-03: 異常系: タイムアウトしたら既定の色で表示し、reason=timeout を送信する", async () => {
    // Arrange
    const { render, send, sendEvent, IpcTimeoutError, ANALYTICS_EVENTS, hook } =
      await load()
    send.mockRejectedValue(
      new IpcTimeoutError("resolveIconColors", hook.ICON_COLOR_TIMEOUT_MS),
    )

    // Act
    const { result } = await render()

    // Assert
    expect(result.current.commands).toEqual([
      { ...command, preserveOriginalColor: false },
    ])
    expect(sendEvent).toHaveBeenCalledTimes(1)
    expect(sendEvent).toHaveBeenCalledWith(
      ANALYTICS_EVENTS.ICON_COLOR_RESOLVE_FAILED,
      expect.objectContaining({ reason: "timeout", query_count: 1 }),
    )
  })

  it("USD-04: 異常系: 応答の形式が不正なら reason=invalid_response を送信する", async () => {
    // Arrange
    const { render, send, sendEvent, ANALYTICS_EVENTS } = await load()
    send.mockResolvedValue(null)

    // Act
    await render()

    // Assert
    expect(sendEvent).toHaveBeenCalledWith(
      ANALYTICS_EVENTS.ICON_COLOR_RESOLVE_FAILED,
      expect.objectContaining({ reason: "invalid_response" }),
    )
  })

  it("USD-05: 異常系: 送信エラーなら reason=error とエラー内容（100文字まで）を送信する", async () => {
    // Arrange
    const { render, send, sendEvent, ANALYTICS_EVENTS } = await load()
    send.mockRejectedValue(new Error("x".repeat(150)))

    // Act
    await render()

    // Assert
    expect(sendEvent).toHaveBeenCalledWith(
      ANALYTICS_EVENTS.ICON_COLOR_RESOLVE_FAILED,
      expect.objectContaining({ reason: "error", error: "x".repeat(100) }),
    )
  })

  it("USD-06: 異常系: 同じページで失敗が繰り返されても送信は1回だけ", async () => {
    // Arrange
    const { render, send, sendEvent } = await load()
    send.mockRejectedValue(new Error("failed"))

    // Act: failed answers stay uncached, so each menu asks again.
    const first = await render()
    first.unmount()
    await render()

    // Assert
    expect(send).toHaveBeenCalledTimes(2)
    expect(sendEvent).toHaveBeenCalledTimes(1)
  })

  it("USD-07: 境界値: 応答がしきい値以上に遅ければ icon_color_resolve_slow を送信する", async () => {
    // Arrange
    const { render, send, sendEvent, ANALYTICS_EVENTS, hook } = await load()
    // The clock moves only while the service worker "answers".
    let clock = 0
    vi.spyOn(performance, "now").mockImplementation(() => clock)
    send.mockImplementation(async () => {
      clock += hook.ICON_COLOR_SLOW_THRESHOLD_MS
      return [false]
    })

    // Act
    await render()

    // Assert
    expect(sendEvent).toHaveBeenCalledWith(
      ANALYTICS_EVENTS.ICON_COLOR_RESOLVE_SLOW,
      { elapsed_ms: hook.ICON_COLOR_SLOW_THRESHOLD_MS, query_count: 1 },
    )
  })

  it("USD-08: 境界値: 応答がしきい値未満なら icon_color_resolve_slow を送信しない", async () => {
    // Arrange
    const { render, send, sendEvent, hook } = await load()
    // The clock moves only while the service worker "answers".
    let clock = 0
    vi.spyOn(performance, "now").mockImplementation(() => clock)
    send.mockImplementation(async () => {
      clock += hook.ICON_COLOR_SLOW_THRESHOLD_MS - 1
      return [false]
    })

    // Act
    await render()

    // Assert
    expect(sendEvent).not.toHaveBeenCalled()
  })
})
