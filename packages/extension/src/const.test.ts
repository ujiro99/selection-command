import { describe, it, expect } from "vitest"
import { OPEN_MODE, getCommandAnalyticsCategory } from "@/const"

describe("getCommandAnalyticsCategory", () => {
  it.each([
    [OPEN_MODE.POPUP, "search"],
    [OPEN_MODE.WINDOW, "search"],
    [OPEN_MODE.TAB, "search"],
    [OPEN_MODE.BACKGROUND_TAB, "search"],
    [OPEN_MODE.SIDE_PANEL, "search"],
    [OPEN_MODE.AI_PROMPT, "aiprompt"],
    [OPEN_MODE.API, "other"],
    [OPEN_MODE.PAGE_ACTION, "other"],
    [OPEN_MODE.LINK_POPUP, "other"],
    [OPEN_MODE.COPY, "other"],
    [OPEN_MODE.GET_TEXT_STYLES, "other"],
    [OPEN_MODE.OPTION, "other"],
    [OPEN_MODE.ADD_PAGE_RULE, "other"],
  ] as const)("maps %s to category %s", (openMode, expected) => {
    expect(getCommandAnalyticsCategory(openMode)).toBe(expected)
  })
})
