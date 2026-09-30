import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  isSidePanelSupported,
  isSidePanelCloseSupported,
  getSidePanelEvent,
} from "../sidePanelSupport"

describe("sidePanelSupport", () => {
  let originalSidePanel: typeof chrome.sidePanel

  beforeEach(() => {
    originalSidePanel = chrome.sidePanel
  })

  afterEach(() => {
    ;(chrome as any).sidePanel = originalSidePanel
  })

  describe("isSidePanelSupported", () => {
    it("SPS-01: 正常系: open と setOptions が存在する場合 true を返す", () => {
      ;(chrome as any).sidePanel = { open: vi.fn(), setOptions: vi.fn() }
      expect(isSidePanelSupported()).toBe(true)
    })

    it("SPS-02: 異常系: chrome.sidePanel が存在しない場合 false を返す", () => {
      ;(chrome as any).sidePanel = undefined
      expect(isSidePanelSupported()).toBe(false)
    })

    it("SPS-03: 異常系: open が存在しない場合 false を返す", () => {
      ;(chrome as any).sidePanel = { setOptions: vi.fn() }
      expect(isSidePanelSupported()).toBe(false)
    })

    it("SPS-04: 異常系: setOptions が存在しない場合 false を返す", () => {
      ;(chrome as any).sidePanel = { open: vi.fn() }
      expect(isSidePanelSupported()).toBe(false)
    })
  })

  describe("isSidePanelCloseSupported", () => {
    it("SPS-05: 正常系: close が存在する場合 true を返す", () => {
      ;(chrome as any).sidePanel = { close: vi.fn() }
      expect(isSidePanelCloseSupported()).toBe(true)
    })

    it("SPS-06: 異常系: close が存在しない場合 false を返す", () => {
      ;(chrome as any).sidePanel = { open: vi.fn(), setOptions: vi.fn() }
      expect(isSidePanelCloseSupported()).toBe(false)
    })
  })

  describe("getSidePanelEvent", () => {
    it("SPS-07: 正常系: イベントが存在する場合そのイベントを返す", () => {
      const onClosed = { addListener: vi.fn() }
      ;(chrome as any).sidePanel = { onClosed }
      expect(getSidePanelEvent("onClosed")).toBe(onClosed)
    })

    it("SPS-08: 異常系: イベントが存在しない場合 undefined を返す", () => {
      ;(chrome as any).sidePanel = { onClosed: { addListener: vi.fn() } }
      expect(getSidePanelEvent("onOpened")).toBeUndefined()
    })

    it("SPS-09: 異常系: chrome.sidePanel が存在しない場合 undefined を返す", () => {
      ;(chrome as any).sidePanel = undefined
      expect(getSidePanelEvent("onOpened")).toBeUndefined()
      expect(getSidePanelEvent("onClosed")).toBeUndefined()
    })
  })
})
