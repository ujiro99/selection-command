import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { fetchIconUrl } from "../chrome"

type OnUpdatedListener = (
  tabId: number,
  changeInfo: chrome.tabs.OnUpdatedInfo,
  tab: chrome.tabs.Tab,
) => void

const TAB_ID = 30
const WINDOW_ID = 3
const SEARCH_URL = "https://example.com/search?q=%s"
const FALLBACK_URL =
  "https://www.google.com/s2/favicons?sz=64&domain_url=https%3A%2F%2Fexample.com"

const tab = (props: Partial<chrome.tabs.Tab>) =>
  ({ id: TAB_ID, ...props }) as chrome.tabs.Tab

describe("fetchIconUrl", () => {
  let listener: OnUpdatedListener | undefined
  const emit = (changeInfo: chrome.tabs.OnUpdatedInfo, t: chrome.tabs.Tab) =>
    listener?.(t.id ?? TAB_ID, changeInfo, t)

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    listener = undefined
    vi.mocked(chrome.tabs.onUpdated.addListener).mockImplementation(
      (l: OnUpdatedListener) => {
        listener = l
      },
    )
    vi.mocked(chrome.tabs.get).mockResolvedValue(tab({ status: "loading" }))
    vi.mocked(chrome.windows.create).mockResolvedValue({
      id: WINDOW_ID,
      tabs: [{ id: TAB_ID }],
    } as chrome.windows.Window)
    vi.mocked(chrome.windows.remove).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("FI-01: 正常系: 読み込み完了時に favIconUrl があればそれを返す", async () => {
    const p = fetchIconUrl(SEARCH_URL)
    await vi.advanceTimersByTimeAsync(0)

    emit(
      { status: "complete" },
      tab({ status: "complete", favIconUrl: "https://example.com/a.ico" }),
    )

    await expect(p).resolves.toBe("https://example.com/a.ico")
    expect(chrome.windows.create).toHaveBeenCalledWith({
      url: "https://example.com/search?q=test",
      state: "minimized",
    })
    expect(chrome.windows.remove).toHaveBeenCalledWith(WINDOW_ID)
    expect(chrome.tabs.onUpdated.removeListener).toHaveBeenCalledWith(listener)
  })

  it("FI-02: 正常系: 読み込み完了後に遅れて届いた favIconUrl を返す", async () => {
    const p = fetchIconUrl(SEARCH_URL)
    await vi.advanceTimersByTimeAsync(0)

    emit({ status: "complete" }, tab({ status: "complete" }))
    // Favicon download takes longer than the old 100ms retry.
    await vi.advanceTimersByTimeAsync(500)
    emit(
      { favIconUrl: "https://example.com/icon.png" },
      tab({ status: "complete", favIconUrl: "https://example.com/icon.png" }),
    )

    await expect(p).resolves.toBe("https://example.com/icon.png")
    expect(chrome.windows.remove).toHaveBeenCalledWith(WINDOW_ID)
  })

  it("FI-03: 正常系: ウィンドウ作成前に読み込みが完了していても取得できる", async () => {
    vi.mocked(chrome.tabs.get).mockResolvedValue(
      tab({ status: "complete", favIconUrl: "https://example.com/b.ico" }),
    )

    await expect(fetchIconUrl(SEARCH_URL)).resolves.toBe(
      "https://example.com/b.ico",
    )
  })

  it("FI-04: 正常系: 他タブのイベントでリスナーが外れない", async () => {
    const p = fetchIconUrl(SEARCH_URL)
    // Another tab updates before the window creation resolves.
    emit({ status: "complete" }, tab({ id: 99, status: "complete" }))
    await vi.advanceTimersByTimeAsync(0)

    emit(
      { status: "complete" },
      tab({ status: "complete", favIconUrl: "https://example.com/c.ico" }),
    )

    await expect(p).resolves.toBe("https://example.com/c.ico")
    expect(chrome.tabs.onUpdated.removeListener).toHaveBeenCalledTimes(1)
  })

  it("FI-05: 異常系: 読み込み完了後も favIconUrl が届かなければ Google のサービスにフォールバックする", async () => {
    const p = fetchIconUrl(SEARCH_URL)
    await vi.advanceTimersByTimeAsync(0)

    emit({ status: "complete" }, tab({ status: "complete" }))
    await vi.advanceTimersByTimeAsync(3000)

    await expect(p).resolves.toBe(FALLBACK_URL)
    expect(chrome.windows.remove).toHaveBeenCalledWith(WINDOW_ID)
  })

  it("FI-06: 異常系: 読み込みがタイムアウトしたら Google のサービスにフォールバックする", async () => {
    const p = fetchIconUrl(SEARCH_URL)
    await vi.advanceTimersByTimeAsync(5000)

    await expect(p).resolves.toBe(FALLBACK_URL)
    expect(chrome.windows.remove).toHaveBeenCalledWith(WINDOW_ID)
    expect(chrome.tabs.onUpdated.removeListener).toHaveBeenCalled()
  })

  it("FI-07: 異常系: タイムアウト時点で favIconUrl が届いていればそれを返す", async () => {
    const p = fetchIconUrl(SEARCH_URL)
    await vi.advanceTimersByTimeAsync(0)

    emit(
      { favIconUrl: "https://example.com/d.ico" },
      tab({ status: "loading", favIconUrl: "https://example.com/d.ico" }),
    )
    await vi.advanceTimersByTimeAsync(5000)

    await expect(p).resolves.toBe("https://example.com/d.ico")
  })

  it("FI-08: 異常系: ウィンドウ作成に失敗したら Google のサービスにフォールバックする", async () => {
    vi.mocked(chrome.windows.create).mockRejectedValue(new Error("failed"))

    await expect(fetchIconUrl(SEARCH_URL)).resolves.toBe(FALLBACK_URL)
    expect(chrome.tabs.onUpdated.removeListener).toHaveBeenCalled()
    expect(chrome.windows.remove).not.toHaveBeenCalled()
  })

  it("FI-11: 異常系: プライベートなホストは Google のサービスにフォールバックせずエラーにする", async () => {
    const p = fetchIconUrl("https://wiki.corp.local/search?q=%s")
    const assertion = expect(p).rejects.toThrow()
    await vi.advanceTimersByTimeAsync(5000)

    await assertion
    expect(chrome.windows.remove).toHaveBeenCalledWith(WINDOW_ID)
  })

  it("FI-12: 正常系: プライベートなホストでも favIconUrl が届けばそれを返す", async () => {
    const p = fetchIconUrl("http://192.168.1.5/search?q=%s")
    await vi.advanceTimersByTimeAsync(0)

    emit(
      { status: "complete", favIconUrl: "http://192.168.1.5/favicon.ico" },
      tab({ status: "complete", favIconUrl: "http://192.168.1.5/favicon.ico" }),
    )

    await expect(p).resolves.toBe("http://192.168.1.5/favicon.ico")
  })

  it("FI-10: 正常系: リダイレクト前のページの favIconUrl は使わずに遷移先の favIconUrl を待つ", async () => {
    const p = fetchIconUrl(SEARCH_URL)
    await vi.advanceTimersByTimeAsync(0)

    emit(
      { favIconUrl: "https://example.com/old.ico" },
      tab({ status: "loading", favIconUrl: "https://example.com/old.ico" }),
    )
    // Client-side redirect to another page.
    emit(
      { status: "loading", url: "https://example.org/" },
      tab({ status: "loading" }),
    )
    emit({ status: "complete" }, tab({ status: "complete" }))
    await vi.advanceTimersByTimeAsync(200)
    emit(
      { favIconUrl: "https://example.org/new.ico" },
      tab({ status: "complete", favIconUrl: "https://example.org/new.ico" }),
    )

    await expect(p).resolves.toBe("https://example.org/new.ico")
  })

  it("FI-09: 境界値: 長すぎる favIconUrl（data URL 等）は Google のサービスに置き換える", async () => {
    const longUrl = "data:image/png;base64," + "A".repeat(2000)
    const p = fetchIconUrl(SEARCH_URL)
    await vi.advanceTimersByTimeAsync(0)

    emit(
      { status: "complete" },
      tab({ status: "complete", favIconUrl: longUrl }),
    )

    await expect(p).resolves.toBe(FALLBACK_URL)
  })

  it("FI-13: 境界値: プライベートなホストで favIconUrl が長すぎれば Google のサービスに置き換えずエラーにする", async () => {
    const longUrl = "data:image/png;base64," + "A".repeat(2000)
    const p = fetchIconUrl("https://wiki.corp.local/search?q=%s")
    const assertion = expect(p).rejects.toThrow()
    await vi.advanceTimersByTimeAsync(0)

    emit(
      { status: "complete" },
      tab({ status: "complete", favIconUrl: longUrl }),
    )

    await assertion
    expect(chrome.windows.remove).toHaveBeenCalledWith(WINDOW_ID)
  })
})
