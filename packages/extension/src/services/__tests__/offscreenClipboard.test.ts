import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { readOffscreenClipboard } from "../offscreenClipboard"

const createDocument = vi.fn()
const closeDocument = vi.fn()
const getContexts = vi.fn()
const sendMessage = vi.fn()

describe("readOffscreenClipboard", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    createDocument.mockResolvedValue(undefined)
    closeDocument.mockResolvedValue(undefined)
    getContexts.mockResolvedValue([])
    sendMessage.mockResolvedValue({ data: "日本語 clipboard" })
    vi.stubGlobal("chrome", {
      ...chrome,
      runtime: {
        ...chrome.runtime,
        getURL: (path: string) => `chrome-extension://test/${path}`,
        getContexts,
        ContextType: { OFFSCREEN_DOCUMENT: "OFFSCREEN_DOCUMENT" },
        sendMessage,
      },
      offscreen: {
        createDocument,
        closeDocument,
        Reason: { CLIPBOARD: "CLIPBOARD" },
      },
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  it("OC-01: 正常系: 非表示ドキュメントで読み取り後に閉じる", async () => {
    await expect(readOffscreenClipboard()).resolves.toEqual({
      data: "日本語 clipboard",
    })
    expect(createDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "src/offscreen_clipboard.html",
        reasons: ["CLIPBOARD"],
      }),
    )
    expect(closeDocument).toHaveBeenCalledOnce()
  })

  it("OC-02: 正常系: 再起動後に残ったドキュメントを再利用する", async () => {
    getContexts.mockResolvedValue([{}])
    await readOffscreenClipboard()
    expect(createDocument).not.toHaveBeenCalled()
    expect(closeDocument).toHaveBeenCalledOnce()
  })

  it("OC-03: 異常系: 読み取り失敗時も閉じてエラーを返す", async () => {
    sendMessage.mockRejectedValue(new Error("Read failed"))
    await expect(readOffscreenClipboard()).resolves.toEqual({
      data: "",
      err: "Read failed",
    })
    expect(closeDocument).toHaveBeenCalledOnce()
  })

  it("OC-04: 正常系: 同時要求では前のドキュメントを閉じてから次を作る", async () => {
    const events: string[] = []
    createDocument.mockImplementation(async () => {
      events.push("create")
    })
    sendMessage.mockImplementation(async () => {
      events.push("read")
      return { data: "text" }
    })
    closeDocument.mockImplementation(async () => {
      events.push("close")
    })
    await Promise.all([readOffscreenClipboard(), readOffscreenClipboard()])
    expect(events).toEqual([
      "create",
      "read",
      "close",
      "create",
      "read",
      "close",
    ])
  })
})
