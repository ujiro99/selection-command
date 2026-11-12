import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  getInstallEnvironmentParams,
  splitUserAgent,
} from "../installEnvironment"

const createDocument = vi.fn()
const getContexts = vi.fn()
const sendMessage = vi.fn()
const getSelf = vi.fn()

describe("splitUserAgent", () => {
  it("IE-01: 100文字以下ならuser_agent_2を含めない", () => {
    expect(splitUserAgent("a".repeat(100))).toEqual({
      user_agent_1: "a".repeat(100),
    })
  })

  it("IE-02: 101文字目以降を最大100文字でuser_agent_2に分割する", () => {
    const ua = "a".repeat(100) + "b".repeat(150)
    expect(splitUserAgent(ua)).toEqual({
      user_agent_1: "a".repeat(100),
      user_agent_2: "b".repeat(100),
    })
  })

  it("IE-03: 空文字はunknownにする", () => {
    expect(splitUserAgent("")).toEqual({ user_agent_1: "unknown" })
  })
})

describe("getInstallEnvironmentParams", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    createDocument.mockResolvedValue(undefined)
    getContexts.mockResolvedValue([])
    getSelf.mockResolvedValue({ installType: "development" })
    sendMessage.mockResolvedValue({ webdriver: true })
    vi.stubGlobal("chrome", {
      ...chrome,
      runtime: {
        ...chrome.runtime,
        getURL: (path: string) => `chrome-extension://test/${path}`,
        getContexts,
        ContextType: { OFFSCREEN_DOCUMENT: "OFFSCREEN_DOCUMENT" },
        sendMessage,
      },
      management: { getSelf },
      offscreen: {
        createDocument,
        Reason: { CLIPBOARD: "CLIPBOARD", DOM_SCRAPING: "DOM_SCRAPING" },
      },
    })
    vi.stubGlobal("navigator", { userAgent: "Mozilla/5.0 HeadlessChrome/151" })
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it("IE-04: 正常系: 共有offscreenドキュメントを作成して読んだ値を返す", async () => {
    await expect(getInstallEnvironmentParams()).resolves.toEqual({
      install_type: "development",
      user_agent_1: "Mozilla/5.0 HeadlessChrome/151",
      is_webdriver: "true",
    })
    expect(createDocument).toHaveBeenCalledWith(
      expect.objectContaining({ url: "src/offscreen_clipboard.html" }),
    )
    expect(sendMessage).toHaveBeenCalledWith({
      target: "offscreen-environment",
    })
  })

  it("IE-05: 既存のoffscreenドキュメントがあれば、作成せずに問い合わせる", async () => {
    getContexts.mockResolvedValue([{}])
    const result = await getInstallEnvironmentParams()
    expect(result.is_webdriver).toBe("true")
    expect(createDocument).not.toHaveBeenCalled()
  })

  it("IE-06: 異常系: 取得に失敗した値はunknownにする", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {})
    createDocument.mockRejectedValue(new Error("not allowed"))
    getSelf.mockRejectedValue(new Error("failed"))
    await expect(getInstallEnvironmentParams()).resolves.toEqual({
      install_type: "unknown",
      user_agent_1: "Mozilla/5.0 HeadlessChrome/151",
      is_webdriver: "unknown",
    })
  })

  it("IE-07: 異常系: 応答がなければタイムアウトでunknownを返す", async () => {
    vi.useFakeTimers()
    sendMessage.mockReturnValue(new Promise(() => {}))
    const pending = getInstallEnvironmentParams()
    await vi.advanceTimersByTimeAsync(3000)
    const result = await pending
    expect(result.is_webdriver).toBe("unknown")
    expect(result.install_type).toBe("development")
  })

  it("IE-08: webdriverがfalseの場合は文字列falseを返す", async () => {
    sendMessage.mockResolvedValue({ webdriver: false })
    const result = await getInstallEnvironmentParams()
    expect(result.is_webdriver).toBe("false")
  })
})
