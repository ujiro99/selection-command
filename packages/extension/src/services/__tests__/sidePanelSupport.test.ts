import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  isSidePanelSupported,
  isSidePanelCloseSupported,
  getSidePanelEvent,
} from "../sidePanelSupport"

// Replace chrome.sidePanel to emulate browsers with/without the API.
const setSidePanel = (value: unknown) => {
  ;(chrome as unknown as { sidePanel: unknown }).sidePanel = value
}

describe("sidePanelSupport", () => {
  let originalSidePanel: typeof chrome.sidePanel

  beforeEach(() => {
    originalSidePanel = chrome.sidePanel
  })

  afterEach(() => {
    setSidePanel(originalSidePanel)
  })

  describe("isSidePanelSupported", () => {
    it("SPS-01: 正常系: open と setOptions が存在する場合 true を返す", () => {
      setSidePanel({ open: vi.fn(), setOptions: vi.fn() })
      expect(isSidePanelSupported()).toBe(true)
    })

    it("SPS-02: 異常系: chrome.sidePanel が存在しない場合 false を返す", () => {
      setSidePanel(undefined)
      expect(isSidePanelSupported()).toBe(false)
    })

    it("SPS-03: 異常系: open が存在しない場合 false を返す", () => {
      setSidePanel({ setOptions: vi.fn() })
      expect(isSidePanelSupported()).toBe(false)
    })

    it("SPS-04: 異常系: setOptions が存在しない場合 false を返す", () => {
      setSidePanel({ open: vi.fn() })
      expect(isSidePanelSupported()).toBe(false)
    })
  })

  describe("isSidePanelCloseSupported", () => {
    it("SPS-05: 正常系: close が存在する場合 true を返す", () => {
      setSidePanel({ close: vi.fn() })
      expect(isSidePanelCloseSupported()).toBe(true)
    })

    it("SPS-06: 異常系: close が存在しない場合 false を返す", () => {
      setSidePanel({ open: vi.fn(), setOptions: vi.fn() })
      expect(isSidePanelCloseSupported()).toBe(false)
    })
  })

  describe("getSidePanelEvent", () => {
    it("SPS-07: 正常系: イベントが存在する場合そのイベントを返す", () => {
      const onClosed = { addListener: vi.fn() }
      setSidePanel({ onClosed })
      expect(getSidePanelEvent("onClosed")).toBe(onClosed)
    })

    it("SPS-08: 異常系: イベントが存在しない場合 undefined を返す", () => {
      setSidePanel({ onClosed: { addListener: vi.fn() } })
      expect(getSidePanelEvent("onOpened")).toBeUndefined()
    })

    it("SPS-09: 異常系: chrome.sidePanel が存在しない場合 undefined を返す", () => {
      setSidePanel(undefined)
      expect(getSidePanelEvent("onOpened")).toBeUndefined()
      expect(getSidePanelEvent("onClosed")).toBeUndefined()
    })
  })
})
