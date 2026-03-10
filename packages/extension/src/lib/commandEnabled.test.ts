import { describe, it, expect, vi, beforeEach } from "vitest"
import { getCommandEnabled } from "./commandEnabled"
import { OPEN_MODE, PAGE_ACTION_OPEN_MODE } from "@/const"
import type { PageActionCommand, SearchCommand } from "@/types"

vi.mock("@/services/dom", () => ({
  linksInSelection: vi.fn(),
}))

import { linksInSelection } from "@/services/dom"

const mockLinksInSelection = vi.mocked(linksInSelection)

// Base command fixture (non-PAGE_ACTION, non-LINK_POPUP)
const baseCommand: SearchCommand = {
  id: "cmd-1",
  title: "Test Command",
  iconUrl: "",
  openMode: OPEN_MODE.TAB,
}

// PAGE_ACTION + CURRENT_TAB command fixture helper
function makePageActionCommand(
  startUrl: string,
  openMode: PAGE_ACTION_OPEN_MODE = PAGE_ACTION_OPEN_MODE.CURRENT_TAB,
): PageActionCommand {
  return {
    ...baseCommand,
    openMode: OPEN_MODE.PAGE_ACTION,
    pageActionOption: {
      startUrl,
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
    it("GCE-01: enabled when links exist in selection", () => {
      mockLinksInSelection.mockReturnValue([
        document.createElement("a"),
        document.createElement("a"),
      ])
      const command = { ...baseCommand, openMode: OPEN_MODE.LINK_POPUP }
      const result = getCommandEnabled(command)
      expect(result.enabled).toBe(true)
      expect(result.message).toBe("2 links")
    })

    it("GCE-02: disabled when no links in selection", () => {
      mockLinksInSelection.mockReturnValue([])
      const command = { ...baseCommand, openMode: OPEN_MODE.LINK_POPUP }
      const result = getCommandEnabled(command)
      expect(result.enabled).toBe(false)
      expect(result.message).toBe("0 links")
    })
  })

  describe("PAGE_ACTION + CURRENT_TAB", () => {
    it("GCE-03: enabled when currentUrl matches startUrl exactly", () => {
      const command = makePageActionCommand("https://example.com/page")
      const result = getCommandEnabled(command, "https://example.com/page")
      expect(result.enabled).toBe(true)
    })

    it("GCE-04: enabled when currentUrl matches startUrl with wildcard", () => {
      const command = makePageActionCommand("https://example.com/*")
      const result = getCommandEnabled(command, "https://example.com/any/path")
      expect(result.enabled).toBe(true)
    })

    it("GCE-05: disabled when currentUrl does not match startUrl", () => {
      const command = makePageActionCommand("https://example.com/page")
      const result = getCommandEnabled(command, "https://other.com/page")
      expect(result.enabled).toBe(false)
      expect(result.message).toBe("Menu_disabled_urlNotMatch")
    })

    it("GCE-06: enabled when startUrl is empty string", () => {
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
      expect(result.message).toBe(baseCommand.title)
    })

    it("GCE-09: enabled for POPUP mode", () => {
      const command = { ...baseCommand, openMode: OPEN_MODE.POPUP }
      const result = getCommandEnabled(command, "https://any.com")
      expect(result.enabled).toBe(true)
    })
  })
})
