import { describe, it, expect } from "vitest"
import { getCommandTargetUrl, truncateMiddle } from "../utils"
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

describe("truncateMiddle", () => {
  it("TM-01: returns the string as it is when it is not longer than the max", () => {
    expect(truncateMiddle("abcdefghij", 10)).toBe("abcdefghij")
  })

  it("TM-02: omits the middle to fit the max length", () => {
    const result = truncateMiddle("abcdefghijklmnopqrstuvwxyz", 10)
    expect(result).toBe("abcd...xyz")
    expect(result).toHaveLength(10)
  })

  it("TM-03: keeps the beginning and the end of a long URL", () => {
    const url = `https://example.com/${"a".repeat(100)}/last-segment`
    const result = truncateMiddle(url, 50)
    expect(result).toHaveLength(50)
    expect(result.startsWith("https://example.com/")).toBe(true)
    expect(result.endsWith("/last-segment")).toBe(true)
  })

  it("TM-04: uses the given separator", () => {
    expect(truncateMiddle("abcdefghijklmnopqrstuvwxyz", 10, "…")).toBe(
      "abcde…wxyz",
    )
  })
})
