import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest"
import { Ipc, ServiceWorkerCommand } from "@/services/ipc"
import { relay } from "@/services/sidePanelRelay"

vi.mock("@/services/ipc", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/ipc")>()
  return {
    ...actual,
    Ipc: { send: vi.fn() },
  }
})

const buildSearch = (params: Record<string, string>) =>
  `?${new URLSearchParams(params).toString()}`

describe("sidePanelRelay", () => {
  const getCurrent = vi.fn()
  const navigate = vi.fn()

  beforeAll(() => {
    ;(chrome.tabs as unknown as { getCurrent: unknown }).getCurrent = getCurrent
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Ipc.send).mockResolvedValue(undefined)
  })

  it("SPR-01: 正常系: サイドパネルがタブなら自身で URL へ遷移する", async () => {
    getCurrent.mockResolvedValue({ id: 5 })

    await relay(
      buildSearch({ url: "https://example.com/?q=1", tabId: "1" }),
      navigate,
    )

    expect(navigate).toHaveBeenCalledWith("https://example.com/?q=1")
    expect(Ipc.send).not.toHaveBeenCalled()
  })

  it("SPR-02: 正常系: サイドパネルがタブでなければ Service Worker にフォールバックを要求する", async () => {
    getCurrent.mockResolvedValue(undefined)

    await relay(
      buildSearch({ url: "https://example.com", tabId: "3" }),
      navigate,
    )

    expect(navigate).not.toHaveBeenCalled()
    expect(Ipc.send).toHaveBeenCalledWith(
      ServiceWorkerCommand.sidePanelRelayFallback,
      { url: "https://example.com", tabId: 3 },
    )
  })

  it.each([
    ["javascript:alert(1)"],
    ["chrome-extension://id/page.html"],
    ["not a url"],
  ])("SPR-03: 異常系: http(s) 以外の URL (%s) では何もしない", async (url) => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    getCurrent.mockResolvedValue({ id: 5 })

    await relay(buildSearch({ url, tabId: "1" }), navigate)

    expect(navigate).not.toHaveBeenCalled()
    expect(Ipc.send).not.toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it("SPR-04: 異常系: URL パラメータが無ければ何もしない", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

    await relay(buildSearch({ tabId: "1" }), navigate)

    expect(getCurrent).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
    expect(Ipc.send).not.toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it.each([[{}], [{ tabId: "" }], [{ tabId: "0" }], [{ tabId: "abc" }]])(
    "SPR-05: 異常系: tabId が不正 (%o) ならフォールバックを要求しない",
    async (tabIdParam) => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
      getCurrent.mockResolvedValue(undefined)

      await relay(
        buildSearch({ url: "https://example.com", ...tabIdParam }),
        navigate,
      )

      expect(Ipc.send).not.toHaveBeenCalled()
      warnSpy.mockRestore()
    },
  )

  it("SPR-06: 境界値: タブとして開かれていれば tabId が無くても遷移する", async () => {
    getCurrent.mockResolvedValue({ id: 5 })

    await relay(buildSearch({ url: "https://example.com" }), navigate)

    expect(navigate).toHaveBeenCalledWith("https://example.com")
  })
})
