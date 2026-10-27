import { describe, it, expect, vi, beforeEach } from "vitest"
import { getCommandEnabled } from "../commandEnabled"
import { OPEN_MODE, PAGE_ACTION_OPEN_MODE } from "@/const"
import type {
  LinkPopupCommand,
  PageActionCommand,
  SearchCommand,
} from "@/types"

vi.mock("@/services/dom", () => ({
  urlsInSelection: vi.fn(),
}))

import { urlsInSelection } from "@/services/dom"

const mockUrlsInSelection = vi.mocked(urlsInSelection)

// Base command fixture (non-PAGE_ACTION, non-LINK_POPUP)
const baseCommand: SearchCommand = {
  id: "cmd-1",
  title: "Test Command",
  iconUrl: "",
  openMode: OPEN_MODE.TAB,
}

// PAGE_ACTION + CURRENT_TAB command fixture helper
// pageUrl: URL pattern for command enablement matching (currentTab only)
function makePageActionCommand(
  pageUrl: string,
  openMode: PAGE_ACTION_OPEN_MODE = PAGE_ACTION_OPEN_MODE.CURRENT_TAB,
): PageActionCommand {
  return {
    ...baseCommand,
    openMode: OPEN_MODE.PAGE_ACTION,
    pageActionOption: {
      startUrl: "https://example.com/recorder", // recorder URL (separate from pattern)
      pageUrl,
      openMode,
      steps: [],
    },
  }
}

describe("getCommandEnabled", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("LINK_POPUP", () => {
    const makeLinkPopupCommand = (openMode?: OPEN_MODE): LinkPopupCommand => ({
      ...baseCommand,
      openMode: OPEN_MODE.LINK_POPUP,
      ...(openMode ? { linkPopupOption: { openMode } } : {}),
    })

    it("GCE-01: enabled when multiple URLs are found in the selection", () => {
      mockUrlsInSelection.mockReturnValue([
        "https://example.com",
        "https://example.org",
      ])
      const result = getCommandEnabled(makeLinkPopupCommand())
      expect(result.enabled).toBe(true)
      expect(result.detail).toBe(
        "1. https://example.com\n2. https://example.org",
      )
    })

    it("GCE-14: shortens long URLs in the detail to 80 characters", () => {
      const longUrl = `https://example.com/${"a".repeat(100)}/end`
      mockUrlsInSelection.mockReturnValue([longUrl])
      const result = getCommandEnabled(makeLinkPopupCommand())
      expect(result.detail).toHaveLength(80)
      expect(result.detail?.startsWith("https://example.com/")).toBe(true)
      expect(result.detail?.endsWith("/end")).toBe(true)
      expect(result.detail).toContain("...")
    })

    it("GCE-15: shortens each long URL in the numbered list", () => {
      const longUrl = `https://example.com/${"a".repeat(100)}`
      mockUrlsInSelection.mockReturnValue([longUrl, "https://example.org/"])
      const result = getCommandEnabled(makeLinkPopupCommand())
      const lines = result.detail?.split("\n") ?? []
      expect(lines).toHaveLength(2)
      expect(lines[0]).toBe(
        `1. ${longUrl.slice(0, 39)}...${longUrl.slice(-38)}`,
      )
      expect(lines[1]).toBe("2. https://example.org/")
    })

    it("GCE-02: disabled when no URL is found in the selection", () => {
      mockUrlsInSelection.mockReturnValue([])
      const result = getCommandEnabled(
        makeLinkPopupCommand(),
        "https://any.com",
        "hello",
      )
      expect(result.enabled).toBe(false)
      expect(result.detail).toBe("Menu_disabled_notUrl")
    })

    it("GCE-10: enabled with the URL when one URL is found in the selection", () => {
      mockUrlsInSelection.mockReturnValue(["https://www.example.com/"])
      const result = getCommandEnabled(
        makeLinkPopupCommand(OPEN_MODE.TAB),
        "https://any.com",
        "see www.example.com",
      )
      expect(mockUrlsInSelection).toHaveBeenCalledWith("see www.example.com")
      expect(result.enabled).toBe(true)
      expect(result.detail).toBe("https://www.example.com/")
    })

    it("GCE-11: enabled for the side panel when one URL is found", () => {
      mockUrlsInSelection.mockReturnValue(["https://example.com/a"])
      const result = getCommandEnabled(
        makeLinkPopupCommand(OPEN_MODE.SIDE_PANEL),
        "https://any.com",
        "https://example.com/a",
      )
      expect(result.enabled).toBe(true)
    })

    it("GCE-12: disabled for the side panel when multiple URLs are found", () => {
      mockUrlsInSelection.mockReturnValue([
        "https://example.com/a",
        "https://example.com/b",
      ])
      const result = getCommandEnabled(
        makeLinkPopupCommand(OPEN_MODE.SIDE_PANEL),
        "https://any.com",
        "a b",
      )
      expect(result.enabled).toBe(false)
      expect(result.detail).toBe("Menu_disabled_multipleUrls")
    })

    it.each([
      OPEN_MODE.POPUP,
      OPEN_MODE.WINDOW,
      OPEN_MODE.TAB,
      OPEN_MODE.BACKGROUND_TAB,
    ])("GCE-13: enabled for %s when multiple URLs are found", (openMode) => {
      mockUrlsInSelection.mockReturnValue([
        "https://example.com/a",
        "https://example.com/b",
      ])
      const result = getCommandEnabled(makeLinkPopupCommand(openMode))
      expect(result.enabled).toBe(true)
    })
  })

  describe("LINK_POPUP with the secondary open mode", () => {
    const makeLinkPopupCommand = (
      openMode: OPEN_MODE,
      openModeSecondary?: OPEN_MODE,
    ): LinkPopupCommand => ({
      ...baseCommand,
      openMode: OPEN_MODE.LINK_POPUP,
      linkPopupOption: { openMode, openModeSecondary },
    })

    beforeEach(() => {
      mockUrlsInSelection.mockReturnValue([
        "https://example.com/a",
        "https://example.com/b",
      ])
    })

    it("GCE-16: enabled with a note when only the Ctrl + click can open multiple URLs", () => {
      const result = getCommandEnabled(
        makeLinkPopupCommand(OPEN_MODE.SIDE_PANEL, OPEN_MODE.TAB),
      )
      expect(result.enabled).toBe(true)
      expect(result.detail).toBe(
        "1. https://example.com/a\n2. https://example.com/b\nMenu_linkPopup_sidePanelClick",
      )
    })

    it("GCE-17: enabled with a note when the Ctrl + click cannot open multiple URLs", () => {
      const result = getCommandEnabled(
        makeLinkPopupCommand(OPEN_MODE.TAB, OPEN_MODE.SIDE_PANEL),
      )
      expect(result.enabled).toBe(true)
      expect(result.detail).toBe(
        "1. https://example.com/a\n2. https://example.com/b\nMenu_linkPopup_sidePanelCtrlClick",
      )
    })

    it("GCE-18: disabled when both the click and the Ctrl + click use the side panel", () => {
      const result = getCommandEnabled(
        makeLinkPopupCommand(OPEN_MODE.SIDE_PANEL, OPEN_MODE.SIDE_PANEL),
      )
      expect(result.enabled).toBe(false)
      expect(result.detail).toBe("Menu_disabled_multipleUrls")
    })

    it("GCE-19: no note for the side panel when one URL is found", () => {
      mockUrlsInSelection.mockReturnValue(["https://example.com/a"])
      const result = getCommandEnabled(
        makeLinkPopupCommand(OPEN_MODE.TAB, OPEN_MODE.SIDE_PANEL),
      )
      expect(result.enabled).toBe(true)
      expect(result.detail).toBe("https://example.com/a")
    })
  })

  describe("LINK_POPUP tooltip", () => {
    const command: LinkPopupCommand = {
      ...baseCommand,
      openMode: OPEN_MODE.LINK_POPUP,
    }

    it("GCE-20: lists up to 20 URLs with a note when more are found", () => {
      const urls = Array.from(
        { length: 25 },
        (_, i) => `https://example.com/${i}`,
      )
      mockUrlsInSelection.mockReturnValue(urls)
      const lines = getCommandEnabled(command).detail?.split("\n") ?? []
      expect(lines).toHaveLength(21)
      expect(lines[19]).toBe("20. https://example.com/19")
      expect(lines[20]).toBe("Menu_linkPopup_tooManyUrls")
    })

    it("GCE-21: lists 20 URLs without a note", () => {
      const urls = Array.from(
        { length: 20 },
        (_, i) => `https://example.com/${i}`,
      )
      mockUrlsInSelection.mockReturnValue(urls)
      const lines = getCommandEnabled(command).detail?.split("\n") ?? []
      expect(lines).toHaveLength(20)
    })

    it("GCE-22: shows percent-encoded characters decoded", () => {
      mockUrlsInSelection.mockReturnValue([
        "https://ja.wikipedia.org/wiki/%E6%9D%B1%E4%BA%AC",
      ])
      const result = getCommandEnabled(command)
      expect(result.detail).toBe("https://ja.wikipedia.org/wiki/東京")
    })
  })

  describe("PAGE_ACTION + CURRENT_TAB", () => {
    it("GCE-03: enabled when currentUrl matches pageUrl exactly", () => {
      const command = makePageActionCommand("https://example.com/page")
      const result = getCommandEnabled(command, "https://example.com/page")
      expect(result.enabled).toBe(true)
    })

    it("GCE-04: enabled when currentUrl matches pageUrl with wildcard", () => {
      const command = makePageActionCommand("https://example.com/*")
      const result = getCommandEnabled(command, "https://example.com/any/path")
      expect(result.enabled).toBe(true)
    })

    it("GCE-05: disabled when currentUrl does not match pageUrl", () => {
      const command = makePageActionCommand("https://example.com/page")
      const result = getCommandEnabled(command, "https://other.com/page")
      expect(result.enabled).toBe(false)
      expect(result.detail).toBe("Menu_disabled_urlNotMatch")
    })

    it("GCE-06: enabled when pageUrl is empty string", () => {
      const command = makePageActionCommand("")
      const result = getCommandEnabled(command, "https://example.com/page")
      expect(result.enabled).toBe(true)
    })

    it("GCE-07: enabled when PAGE_ACTION openMode is TAB (not CURRENT_TAB)", () => {
      const command = makePageActionCommand(
        "https://example.com/page",
        PAGE_ACTION_OPEN_MODE.TAB,
      )
      const result = getCommandEnabled(command, "https://other.com/page")
      expect(result.enabled).toBe(true)
    })
  })

  describe("Other open modes", () => {
    it("GCE-08: enabled for TAB mode", () => {
      const result = getCommandEnabled(baseCommand, "https://any.com")
      expect(result.enabled).toBe(true)
      expect(result.detail).toBeUndefined()
    })

    it("GCE-09: enabled for POPUP mode", () => {
      const command = { ...baseCommand, openMode: OPEN_MODE.POPUP }
      const result = getCommandEnabled(command, "https://any.com")
      expect(result.enabled).toBe(true)
    })
  })
})
