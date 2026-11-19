import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  buildRelayPath,
  initSidePanelUrlMode,
  isRelayableUrl,
  isValidTabId,
  markDirectUrlSupported,
  toSidePanelPath,
  SIDE_PANEL_RELAY_PATH,
  __test,
} from "@/services/sidePanelUrl"
import { Storage, LOCAL_STORAGE_KEY } from "@/services/storage"

vi.mock("@/services/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/storage")>()
  return {
    ...actual,
    Storage: {
      get: vi.fn(),
      set: vi.fn(),
    },
  }
})

const USER_AGENT = "Mozilla/5.0 (Test Browser) Chrome/120.0.0.0"

describe("sidePanelUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal("navigator", { userAgent: USER_AGENT })
    __test.reset()
    vi.mocked(Storage.get).mockResolvedValue(undefined)
    vi.mocked(Storage.set).mockResolvedValue(true)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe("buildRelayPath", () => {
    it("SPU-BR-01: 正常系: URL と tabId をクエリに含む中継ページのパスを返す", () => {
      const path = buildRelayPath("https://example.com/?q=a b&x=1", 10)
      const [base, query] = path.split("?")
      const params = new URLSearchParams(query)

      expect(base).toBe(SIDE_PANEL_RELAY_PATH)
      expect(params.get("url")).toBe("https://example.com/?q=a b&x=1")
      expect(params.get("tabId")).toBe("10")
    })
  })

  describe("toSidePanelPath", () => {
    it("SPU-TP-01: 正常系: 初期状態では中継ページのパスを返す", () => {
      expect(toSidePanelPath("https://example.com", 1)).toBe(
        buildRelayPath("https://example.com", 1),
      )
    })

    it("SPU-TP-02: 正常系: 直接指定の検出後は URL をそのまま返す", async () => {
      await markDirectUrlSupported()

      expect(toSidePanelPath("https://example.com", 1)).toBe(
        "https://example.com",
      )
      expect(Storage.set).toHaveBeenCalledWith(
        LOCAL_STORAGE_KEY.SIDE_PANEL_DIRECT_URL,
        USER_AGENT,
      )
    })

    it("SPU-TP-03: 境界値: http(s) 以外の URL は中継しない", () => {
      expect(toSidePanelPath("chrome-extension://id/page.html", 1)).toBe(
        "chrome-extension://id/page.html",
      )
    })
  })

  describe("initSidePanelUrlMode", () => {
    it("SPU-IN-01: 正常系: 同じブラウザバージョンで保存された検出結果を読み込む", async () => {
      vi.mocked(Storage.get).mockResolvedValue(USER_AGENT)

      await initSidePanelUrlMode()

      expect(toSidePanelPath("https://example.com", 1)).toBe(
        "https://example.com",
      )
    })

    it("SPU-IN-02: 正常系: 未保存なら中継ページを使う", async () => {
      await initSidePanelUrlMode()

      expect(toSidePanelPath("https://example.com", 1)).toBe(
        buildRelayPath("https://example.com", 1),
      )
    })

    it("SPU-IN-04: 正常系: ブラウザバージョンが変わっていれば検出し直す（中継ページを使う）", async () => {
      vi.mocked(Storage.get).mockResolvedValue(
        "Mozilla/5.0 (Old Browser) Chrome/100.0.0.0",
      )

      await initSidePanelUrlMode()

      expect(toSidePanelPath("https://example.com", 1)).toBe(
        buildRelayPath("https://example.com", 1),
      )
    })

    it("SPU-IN-03: 異常系: 読み込みに失敗しても例外を投げない", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
      vi.mocked(Storage.get).mockRejectedValue(new Error("failed"))

      await expect(initSidePanelUrlMode()).resolves.toBeUndefined()
      warnSpy.mockRestore()
    })
  })

  describe("isValidTabId", () => {
    it.each([
      [1, true],
      [123, true],
      [0, false],
      [-1, false],
      [1.5, false],
      [NaN, false],
      ["1", false],
      [undefined, false],
    ])("SPU-VT-01: %s -> %s", (tabId, expected) => {
      expect(isValidTabId(tabId)).toBe(expected)
    })
  })

  describe("isRelayableUrl", () => {
    it.each([
      ["https://example.com", true],
      ["http://example.com", true],
      ["javascript:alert(1)", false],
      ["data:text/html,a", false],
      ["not a url", false],
      [null, false],
    ])("SPU-RU-01: %s -> %s", (url, expected) => {
      expect(isRelayableUrl(url)).toBe(expected)
    })
  })
})
