import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { readOffscreenClipboard } from "../offscreenClipboard"

const createDocument = vi.fn()
const getContexts = vi.fn()
const sendMessage = vi.fn()

describe("readOffscreenClipboard", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    createDocument.mockResolvedValue(undefined)
    let documentExists = false
    getContexts.mockImplementation(async () => (documentExists ? [{}] : []))
    createDocument.mockImplementation(async () => {
      documentExists = true
    })
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
        Reason: { CLIPBOARD: "CLIPBOARD" },
      },
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  it("OC-01: 正常系: 非表示ドキュメントを再利用し毎回最新の文字列を返す", async () => {
    await expect(readOffscreenClipboard()).resolves.toEqual({
      data: "日本語 clipboard",
    })
    expect(createDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "src/offscreen_clipboard.html",
        reasons: ["CLIPBOARD"],
      }),
    )
    sendMessage.mockResolvedValue({ data: "updated" })
    await expect(readOffscreenClipboard()).resolves.toEqual({ data: "updated" })
    expect(createDocument).toHaveBeenCalledOnce()
    expect(sendMessage).toHaveBeenCalledTimes(2)
  })

  it("OC-02: 正常系: 再起動後に残ったドキュメントを再利用する", async () => {
    getContexts.mockResolvedValue([{}])
    await readOffscreenClipboard()
    expect(createDocument).not.toHaveBeenCalled()
  })

  it("OC-03: 異常系: 読み取り失敗後も次の要求で読み取れる", async () => {
    sendMessage.mockRejectedValue(new Error("Read failed"))
    await expect(readOffscreenClipboard()).resolves.toEqual({
      data: "",
      err: "Read failed",
    })
    sendMessage.mockResolvedValue({ data: "recovered" })
    await expect(readOffscreenClipboard()).resolves.toEqual({
      data: "recovered",
    })
    expect(createDocument).toHaveBeenCalledOnce()
  })

  it("OC-04: 正常系: 同時要求でも一度だけ作成して異なる値を順に返す", async () => {
    sendMessage
      .mockResolvedValueOnce({ data: "first" })
      .mockResolvedValueOnce({ data: "second" })
    const results = await Promise.all([
      readOffscreenClipboard(),
      readOffscreenClipboard(),
    ])
    expect(results).toEqual([{ data: "first" }, { data: "second" }])
    expect(createDocument).toHaveBeenCalledOnce()
  })

  it("OC-05: 正常系: ドキュメントが破棄されたら再作成する", async () => {
    await readOffscreenClipboard()
    getContexts.mockResolvedValueOnce([])
    await readOffscreenClipboard()
    expect(createDocument).toHaveBeenCalledTimes(2)
  })

  it("OC-06: 異常系: 作成失敗後の要求で再試行できる", async () => {
    createDocument.mockRejectedValueOnce(new Error("Creation failed"))
    await expect(readOffscreenClipboard()).resolves.toEqual({
      data: "",
      err: "Creation failed",
    })
    await expect(readOffscreenClipboard()).resolves.toEqual({
      data: "日本語 clipboard",
    })
  })
})
