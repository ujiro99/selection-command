import { describe, it, expect } from "vitest"
import { getCommandTargetUrl } from "../utils"
import { OPEN_MODE, PAGE_ACTION_OPEN_MODE } from "@/const"

describe("getCommandTargetUrl", () => {
  it("returns the page action startUrl instead of searchUrl", () => {
    expect(
      getCommandTargetUrl({
        id: "page-action",
        title: "Page Action",
        iconUrl: "",
        openMode: OPEN_MODE.PAGE_ACTION,
        searchUrl: "https://example.com/search?q=%s",
        pageActionOption: {
          startUrl: "https://example.com/start",
          openMode: PAGE_ACTION_OPEN_MODE.CURRENT_TAB,
          steps: [],
        },
      }),
    ).toBe("https://example.com/start")
  })

  it("returns searchUrl for non-page-action commands", () => {
    expect(
      getCommandTargetUrl({
        id: "search",
        title: "Search",
        iconUrl: "",
        openMode: OPEN_MODE.TAB,
        searchUrl: "https://example.com/search?q=%s",
      }),
    ).toBe("https://example.com/search?q=%s")
  })
})
