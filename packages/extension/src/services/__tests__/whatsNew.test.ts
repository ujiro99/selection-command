import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NEW_HUB_URL, VERSION } from "@/const"
import { ANALYTICS_EVENTS, sendEvent } from "@/services/analytics"
import {
  getWhatsNewUrl,
  openWhatsNewTab,
  shouldShowWhatsNew,
} from "../whatsNew"

vi.mock("@/services/analytics", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/analytics")>()
  return { ...actual, sendEvent: vi.fn() }
})

describe("getWhatsNewUrl", () => {
  it("WN-01: 言語なしのwhats-newへUTM付きで、バージョンのフラグメントを付ける", () => {
    const url = new URL(getWhatsNewUrl("1.4.2"))
    expect(`${url.origin}${url.pathname}`).toBe(`${NEW_HUB_URL}/whats-new`)
    expect(url.searchParams.get("utm_source")).toBe("extension")
    expect(url.searchParams.get("utm_medium")).toBe("link")
    expect(url.searchParams.get("utm_campaign")).toBe("whats-new")
    expect(url.hash).toBe("#v1.4.2")
  })
})

describe("shouldShowWhatsNew", () => {
  it("WN-02: パッチ版を含め、バージョンが変わったら表示する", () => {
    expect(shouldShowWhatsNew("1.4.1", "1.4.2")).toBe(true)
    expect(shouldShowWhatsNew("1.3.2", "1.4.0")).toBe(true)
  })

  it("WN-03: 同じバージョンの再読み込みでは表示しない", () => {
    expect(shouldShowWhatsNew("1.4.2", "1.4.2")).toBe(false)
  })

  it("WN-04: 更新前のバージョンが不明なら表示しない", () => {
    expect(shouldShowWhatsNew(undefined, "1.4.2")).toBe(false)
    expect(shouldShowWhatsNew("", "1.4.2")).toBe(false)
  })
})

describe("openWhatsNewTab", () => {
  beforeEach(() => {
    vi.mocked(chrome.tabs.create).mockReset()
    vi.mocked(sendEvent).mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("WN-05: バージョンが変わっていれば現バージョンのページを開いて記録する", async () => {
    vi.mocked(chrome.tabs.create).mockResolvedValue(undefined)

    await openWhatsNewTab("0.0.0-old")

    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: getWhatsNewUrl(VERSION),
    })
    expect(sendEvent).toHaveBeenCalledWith(
      ANALYTICS_EVENTS.WHATS_NEW_TAB_OPENED,
      { success: "true", previous_version: "0.0.0-old" },
      expect.anything(),
    )
  })

  it("WN-06: 同じバージョンならタブを開かない", async () => {
    await openWhatsNewTab(VERSION)

    expect(chrome.tabs.create).not.toHaveBeenCalled()
    expect(sendEvent).not.toHaveBeenCalled()
  })

  it("WN-07: タブ作成に失敗しても例外を投げず、失敗を記録する", async () => {
    vi.mocked(chrome.tabs.create).mockRejectedValue(new Error("No window"))
    vi.spyOn(console, "error").mockImplementation(() => {})

    await expect(openWhatsNewTab("0.0.0-old")).resolves.toBeUndefined()

    expect(sendEvent).toHaveBeenCalledWith(
      ANALYTICS_EVENTS.WHATS_NEW_TAB_OPENED,
      expect.objectContaining({
        success: "false",
        previous_version: "0.0.0-old",
      }),
      expect.anything(),
    )
  })
})
