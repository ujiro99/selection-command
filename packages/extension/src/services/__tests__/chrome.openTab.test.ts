import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { openTab } from "../chrome"
import { Ipc } from "../ipc"
import { readOffscreenClipboard } from "../offscreenClipboard"

vi.mock("../offscreenClipboard", () => ({ readOffscreenClipboard: vi.fn() }))

const sourceTab = { id: 10, windowId: 1, index: 2 } as chrome.tabs.Tab
const resultTab = { id: 20, windowId: 1 } as chrome.tabs.Tab
const url = {
  searchUrl: "https://example.com/?q=%s",
  selectionText: "",
  selectionFromClipboard: true,
}

describe("openTab", () => {
  afterEach(() => vi.unstubAllGlobals())
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(chrome.tabs.query).mockImplementation(() =>
      Promise.resolve([sourceTab]),
    )
    vi.mocked(chrome.tabs.create).mockImplementation(() =>
      Promise.resolve(resultTab),
    )
    vi.stubGlobal("chrome", {
      ...chrome,
      windows: {
        ...chrome.windows,
        create: vi.fn().mockResolvedValue({ id: 3, tabs: [{ id: 30 }] }),
        remove: vi.fn().mockResolvedValue(undefined),
      },
    })
    vi.mocked(readOffscreenClipboard).mockResolvedValue({
      data: "clipboard text",
    })
  })

  it("COT-01: 正常系: Offscreenで読み非アクティブタブを直接作成する", async () => {
    const result = await openTab({ url, active: false })

    expect(readOffscreenClipboard).toHaveBeenCalledOnce()
    expect(chrome.windows.create).not.toHaveBeenCalled()
    expect(chrome.tabs.create).toHaveBeenCalledExactlyOnceWith({
      url: "https://example.com/?q=clipboard+text",
      active: false,
      windowId: 1,
      index: 3,
    })
    expect(chrome.tabs.update).not.toHaveBeenCalled()
    expect(result).toEqual({ tabId: 20, clipboardText: "clipboard text" })
  })

  it("COT-01-a: 正常系: アクティブタブも完成したURLで一度だけ作成する", async () => {
    await openTab({ url, active: true })
    expect(readOffscreenClipboard).toHaveBeenCalledOnce()
    expect(chrome.tabs.create).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        url: "https://example.com/?q=clipboard+text",
        active: true,
      }),
    )
    expect(chrome.tabs.update).not.toHaveBeenCalled()
  })

  it("COT-02: 正常系: クリップボード不要なら一時ウィンドウを開かない", async () => {
    await openTab({
      url: { ...url, selectionText: "selected", selectionFromClipboard: false },
      active: false,
    })

    expect(readOffscreenClipboard).not.toHaveBeenCalled()
    expect(chrome.windows.create).not.toHaveBeenCalled()
    expect(chrome.tabs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://example.com/?q=selected",
        active: false,
      }),
    )
  })

  it("COT-03: 異常系: 読み取り失敗時は非アクティブで開き元のタブへエラーを通知する", async () => {
    vi.mocked(readOffscreenClipboard).mockResolvedValue({
      data: "",
      err: "Permission denied",
    })
    const connection = vi.spyOn(Ipc, "ensureConnection").mockResolvedValue()
    const sendTab = vi.spyOn(Ipc, "sendTab").mockResolvedValue(undefined)
    try {
      const result = await openTab({ url, active: false })
      expect(chrome.tabs.create).toHaveBeenCalledWith(
        expect.objectContaining({ active: false }),
      )
      expect(connection).toHaveBeenCalledWith(10)
      expect(sendTab).toHaveBeenCalledWith(10, "showToast", expect.any(Object))
      expect(chrome.windows.create).not.toHaveBeenCalled()
      expect(result).toEqual({ tabId: 20, clipboardText: "" })
    } finally {
      connection.mockRestore()
      sendTab.mockRestore()
    }
  })

  it("COT-04: 異常系: アクティブタブで開いた場合は新しいタブへエラーを通知する", async () => {
    vi.mocked(readOffscreenClipboard).mockResolvedValue({
      data: "",
      err: "Permission denied",
    })
    const connection = vi.spyOn(Ipc, "ensureConnection").mockResolvedValue()
    const sendTab = vi.spyOn(Ipc, "sendTab").mockResolvedValue(undefined)
    try {
      await openTab({ url, active: true })
      expect(connection).toHaveBeenCalledWith(20)
      expect(sendTab).toHaveBeenCalledWith(20, "showToast", expect.any(Object))
    } finally {
      connection.mockRestore()
      sendTab.mockRestore()
    }
  })
})
