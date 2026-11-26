import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { OPEN_MODE, PAGE_ACTION_OPEN_MODE } from "@/const"
import type { Command } from "@/types"
import {
  usesSidePanel,
  preOpenSidePanel,
  consumePreOpenedSidePanel,
  cancelPreOpenedSidePanel,
  __test,
} from "../sidePanelPreOpen"

const { resetPreOpenedSidePanels, PRE_OPEN_TIMEOUT_MS } = __test
import { closeSidePanel } from "@/services/chrome"
import {
  isSidePanelSupported,
  getSidePanelEvent,
} from "@/services/sidePanelSupport"
import { ServiceWorkerData } from "@/services/serviceWorkerData"
import { SIDE_PANEL_RELAY_PATH } from "@/services/sidePanelUrl"

vi.mock("@/services/chrome", () => ({
  closeSidePanel: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/services/sidePanelSupport", () => ({
  isSidePanelSupported: vi.fn(() => true),
  getSidePanelEvent: vi.fn(() => undefined),
}))

vi.mock("@/services/serviceWorkerData", () => ({
  ServiceWorkerData: {
    get: vi.fn(() => ({ sidePanelTabs: [] })),
  },
}))

const createCommand = (props: Partial<Command>): Command =>
  ({
    id: "cmd",
    title: "Command",
    searchUrl: "https://example.com/?q=%s",
    iconUrl: "",
    ...props,
  }) as Command

describe("sidePanelPreOpen", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    vi.mocked(chrome.sidePanel.open).mockResolvedValue(undefined)
    vi.mocked(chrome.sidePanel.setOptions).mockResolvedValue(undefined)
    resetPreOpenedSidePanels()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("usesSidePanel", () => {
    it("SPO-US-01: 正常系: サイドパネルを開くコマンドを判定する", () => {
      expect(
        usesSidePanel(createCommand({ openMode: OPEN_MODE.SIDE_PANEL })),
      ).toBe(true)
      expect(
        usesSidePanel(
          createCommand({
            openMode: OPEN_MODE.AI_PROMPT,
            aiPromptOption: { openMode: OPEN_MODE.SIDE_PANEL },
          } as Partial<Command>),
        ),
      ).toBe(true)
      expect(
        usesSidePanel(
          createCommand({
            openMode: OPEN_MODE.PAGE_ACTION,
            pageActionOption: { openMode: PAGE_ACTION_OPEN_MODE.SIDE_PANEL },
          } as Partial<Command>),
        ),
      ).toBe(true)
    })

    it("SPO-US-02: 正常系: サイドパネルを開かないコマンドは false を返す", () => {
      expect(usesSidePanel(createCommand({ openMode: OPEN_MODE.POPUP }))).toBe(
        false,
      )
      expect(
        usesSidePanel(
          createCommand({
            openMode: OPEN_MODE.AI_PROMPT,
            aiPromptOption: { openMode: OPEN_MODE.POPUP },
          } as Partial<Command>),
        ),
      ).toBe(false)
      expect(
        usesSidePanel(
          createCommand({
            openMode: OPEN_MODE.PAGE_ACTION,
            pageActionOption: { openMode: PAGE_ACTION_OPEN_MODE.TAB },
          } as Partial<Command>),
        ),
      ).toBe(false)
    })
  })

  describe("preOpenSidePanel", () => {
    it("SPO-PO-01: 正常系: 空白ページを設定して同期的に open を呼び出す", () => {
      preOpenSidePanel(1)

      expect(chrome.sidePanel.setOptions).toHaveBeenCalledWith({
        tabId: 1,
        path: SIDE_PANEL_RELAY_PATH,
        enabled: true,
      })
      // Called synchronously, without waiting for setOptions.
      expect(chrome.sidePanel.open).toHaveBeenCalledWith({ tabId: 1 })
    })

    it("SPO-PO-02: 異常系: API 非対応時は何もしない", () => {
      vi.mocked(isSidePanelSupported).mockReturnValueOnce(false)

      preOpenSidePanel(1)

      expect(chrome.sidePanel.open).not.toHaveBeenCalled()
      expect(consumePreOpenedSidePanel(1)).toBe(false)
    })

    it("SPO-PO-03: 異常系: open に失敗したら事前オープン状態を破棄する", async () => {
      vi.mocked(chrome.sidePanel.open).mockRejectedValueOnce(
        new Error("no user gesture"),
      )
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      preOpenSidePanel(1)
      await vi.waitFor(() => expect(errorSpy).toHaveBeenCalled())

      expect(consumePreOpenedSidePanel(1)).toBe(false)
      errorSpy.mockRestore()
    })

    it("SPO-PO-04: 異常系: 期限内に使われなければサイドパネルを閉じる", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
      preOpenSidePanel(1)

      vi.advanceTimersByTime(PRE_OPEN_TIMEOUT_MS)

      expect(closeSidePanel).toHaveBeenCalledWith(1, expect.any(Function))
      expect(consumePreOpenedSidePanel(1)).toBe(false)
      warnSpy.mockRestore()
    })
  })

  describe("consumePreOpenedSidePanel", () => {
    it("SPO-CO-01: 正常系: 事前オープン状態を一度だけ返し、閉じるタイマーを止める", () => {
      preOpenSidePanel(1)

      expect(consumePreOpenedSidePanel(2)).toBe(false)
      expect(consumePreOpenedSidePanel(1)).toBe(true)
      expect(consumePreOpenedSidePanel(1)).toBe(false)

      vi.advanceTimersByTime(PRE_OPEN_TIMEOUT_MS)
      expect(closeSidePanel).not.toHaveBeenCalled()
    })
  })

  describe("cancelPreOpenedSidePanel", () => {
    it("SPO-CA-01: 正常系: 未使用の事前オープンしたサイドパネルを閉じる", () => {
      preOpenSidePanel(1)

      cancelPreOpenedSidePanel(1)

      expect(closeSidePanel).toHaveBeenCalledWith(1, expect.any(Function))
      expect(consumePreOpenedSidePanel(1)).toBe(false)
    })

    it("SPO-CA-02: 正常系: 使用済みまたは未オープンなら何もしない", () => {
      preOpenSidePanel(1)
      consumePreOpenedSidePanel(1)

      cancelPreOpenedSidePanel(1)
      cancelPreOpenedSidePanel(2)

      expect(closeSidePanel).not.toHaveBeenCalled()
    })
  })
  describe("already open side panel", () => {
    const setOpenTabs = (tabIds: number[]) => {
      vi.mocked(getSidePanelEvent).mockReturnValue({} as never)
      vi.mocked(ServiceWorkerData.get).mockReturnValue({
        sidePanelTabs: tabIds.map((tabId) => ({ tabId, isLinkCommand: false })),
      } as never)
    }

    afterEach(() => {
      vi.mocked(getSidePanelEvent).mockReturnValue(undefined)
      vi.mocked(ServiceWorkerData.get).mockReturnValue({
        sidePanelTabs: [],
      } as never)
    })

    it("SPO-AO-01: 正常系: 開いているサイドパネルは置き換えず、キャンセルしても閉じない", () => {
      setOpenTabs([1])

      preOpenSidePanel(1)

      expect(chrome.sidePanel.setOptions).not.toHaveBeenCalled()
      expect(chrome.sidePanel.open).not.toHaveBeenCalled()

      cancelPreOpenedSidePanel(1)
      expect(closeSidePanel).not.toHaveBeenCalled()
    })

    it("SPO-AO-02: 正常系: 開いているサイドパネルでもページの設定だけを行わせる", () => {
      setOpenTabs([1])

      preOpenSidePanel(1)

      expect(consumePreOpenedSidePanel(1)).toBe(true)
    })

    it("SPO-AO-03: 正常系: onClosed 非対応時は開閉状態を信用せず事前オープンする", () => {
      setOpenTabs([1])
      vi.mocked(getSidePanelEvent).mockReturnValue(undefined)

      preOpenSidePanel(1)

      expect(chrome.sidePanel.open).toHaveBeenCalledWith({ tabId: 1 })
    })
  })

  describe("delayed close", () => {
    it("SPO-DC-01: 正常系: 閉じている間に再度開かれたら無効化しない", () => {
      preOpenSidePanel(1)
      cancelPreOpenedSidePanel(1)
      const shouldDisable = vi.mocked(closeSidePanel).mock.calls[0][1]!

      expect(shouldDisable()).toBe(true)

      // The side panel is requested again before the close finishes.
      consumePreOpenedSidePanel(1)
      expect(shouldDisable()).toBe(false)
    })

    it("SPO-DC-02: 正常系: 閉じている間に再度事前オープンされたら無効化しない", () => {
      preOpenSidePanel(1)
      cancelPreOpenedSidePanel(1)
      const shouldDisable = vi.mocked(closeSidePanel).mock.calls[0][1]!

      preOpenSidePanel(1)
      expect(shouldDisable()).toBe(false)
    })
  })
})
