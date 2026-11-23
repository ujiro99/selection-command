import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  openSidePanel,
  closeSidePanel,
  updateSidePanelUrl,
  setSidePanelUrlDirectly,
} from "@/services/chrome"
import {
  buildRelayPath,
  markDirectUrlSupported,
  __test as sidePanelUrlTest,
} from "@/services/sidePanelUrl"

// Replace chrome.sidePanel to emulate browsers with/without the API.
const setSidePanel = (value: unknown) => {
  ;(chrome as unknown as { sidePanel: unknown }).sidePanel = value
}

const originalSidePanel = chrome.sidePanel

const createSidePanelMock = (withClose = true) => ({
  open: vi.fn().mockResolvedValue(undefined),
  setOptions: vi.fn().mockResolvedValue(undefined),
  ...(withClose ? { close: vi.fn().mockResolvedValue(undefined) } : {}),
})

describe("chrome.ts side panel functions", () => {
  let sidePanel: ReturnType<typeof createSidePanelMock>

  beforeEach(() => {
    vi.useFakeTimers()
    sidePanel = createSidePanelMock()
    setSidePanel(sidePanel)
    sidePanelUrlTest.reset()
  })

  afterEach(() => {
    vi.useRealTimers()
    setSidePanel(originalSidePanel)
  })

  describe("openSidePanel", () => {
    it("CSP-OP-01: 正常系: 中継ページを path に指定して setOptions と open を呼び出す", async () => {
      const result = await openSidePanel({
        url: "https://example.com",
        tabId: 1,
      })

      expect(sidePanel.setOptions).toHaveBeenCalledWith({
        tabId: 1,
        path: buildRelayPath("https://example.com", 1),
        enabled: true,
      })
      expect(sidePanel.open).toHaveBeenCalledWith({ tabId: 1 })
      expect(result).toEqual({ tabId: 1 })
    })

    it("CSP-OP-03: 正常系: URL の直接指定が検出済みなら URL をそのまま path に指定する", async () => {
      await markDirectUrlSupported()

      await openSidePanel({ url: "https://example.com", tabId: 1 })

      expect(sidePanel.setOptions).toHaveBeenCalledWith({
        tabId: 1,
        path: "https://example.com",
        enabled: true,
      })
    })

    it("CSP-OP-04: 正常系: 事前オープン済みなら setOptions だけを呼び出す", async () => {
      const result = await openSidePanel(
        { url: "https://example.com", tabId: 1 },
        true,
      )

      expect(sidePanel.setOptions).toHaveBeenCalledWith({
        tabId: 1,
        path: buildRelayPath("https://example.com", 1),
        enabled: true,
      })
      expect(sidePanel.open).not.toHaveBeenCalled()
      expect(result).toEqual({ tabId: 1 })
    })

    it("CSP-OP-02: 異常系: API 非対応時は reject し API を呼び出さない", async () => {
      setSidePanel(undefined)

      await expect(
        openSidePanel({ url: "https://example.com", tabId: 1 }),
      ).rejects.toThrow("not supported")
    })
  })

  describe("closeSidePanel", () => {
    it("CSP-CL-01: 正常系: close 後にアニメーションを待って無効化する", async () => {
      const promise = closeSidePanel(1)
      await vi.advanceTimersByTimeAsync(0)

      expect(sidePanel.close).toHaveBeenCalledWith({ tabId: 1 })
      expect(sidePanel.setOptions).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(1000)
      await promise

      expect(sidePanel.setOptions).toHaveBeenCalledWith({
        tabId: 1,
        enabled: false,
      })
    })

    it("CSP-CL-02: 正常系: close 未提供時は待たずに setOptions で無効化する", async () => {
      sidePanel = createSidePanelMock(false)
      setSidePanel(sidePanel)

      await closeSidePanel(1)

      expect(sidePanel.setOptions).toHaveBeenCalledWith({
        tabId: 1,
        enabled: false,
      })
    })

    it("CSP-CL-03: 異常系: API 非対応時は何もせず resolve する", async () => {
      setSidePanel(undefined)

      await expect(closeSidePanel(1)).resolves.toBeUndefined()
    })
  })

  describe("updateSidePanelUrl", () => {
    it("CSP-UP-01: 正常系: 中継ページ経由で URL を更新する", async () => {
      await updateSidePanelUrl({ url: "https://example.com/next", tabId: 1 })

      expect(sidePanel.setOptions).toHaveBeenCalledWith({
        tabId: 1,
        path: buildRelayPath("https://example.com/next", 1),
        enabled: true,
      })
    })

    it("CSP-UP-03: 正常系: URL の直接指定が検出済みなら URL をそのまま path に指定する", async () => {
      await markDirectUrlSupported()

      await updateSidePanelUrl({ url: "https://example.com/next", tabId: 1 })

      expect(sidePanel.setOptions).toHaveBeenCalledWith({
        tabId: 1,
        path: "https://example.com/next",
        enabled: true,
      })
    })

    it("CSP-UP-02: 異常系: API 非対応時は reject する", async () => {
      setSidePanel(undefined)

      await expect(
        updateSidePanelUrl({ url: "https://example.com/next", tabId: 1 }),
      ).rejects.toThrow("not supported")
    })
  })

  describe("setSidePanelUrlDirectly", () => {
    it("CSP-SD-01: 正常系: URL をそのまま path に指定し、以降は中継ページを使わない", async () => {
      await setSidePanelUrlDirectly({ url: "https://example.com", tabId: 1 })

      expect(sidePanel.setOptions).toHaveBeenCalledWith({
        tabId: 1,
        path: "https://example.com",
        enabled: true,
      })

      await openSidePanel({ url: "https://example.com/next", tabId: 2 })
      expect(sidePanel.setOptions).toHaveBeenLastCalledWith({
        tabId: 2,
        path: "https://example.com/next",
        enabled: true,
      })
    })

    it("CSP-SD-03: 異常系: setOptions が失敗したら reject する", async () => {
      sidePanel.setOptions.mockRejectedValue(new Error("setOptions failed"))

      await expect(
        setSidePanelUrlDirectly({ url: "https://example.com", tabId: 1 }),
      ).rejects.toThrow("setOptions failed")

      // The direct mode must not be remembered when setOptions fails.
      sidePanel.setOptions.mockResolvedValue(undefined)
      await openSidePanel({ url: "https://example.com/next", tabId: 2 })
      expect(sidePanel.setOptions).toHaveBeenLastCalledWith({
        tabId: 2,
        path: buildRelayPath("https://example.com/next", 2),
        enabled: true,
      })
    })

    it("CSP-SD-02: 異常系: API 非対応時は reject する", async () => {
      setSidePanel(undefined)

      await expect(
        setSidePanelUrlDirectly({ url: "https://example.com", tabId: 1 }),
      ).rejects.toThrow("not supported")
    })
  })
})
