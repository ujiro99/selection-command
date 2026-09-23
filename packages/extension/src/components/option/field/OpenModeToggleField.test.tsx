import { describe, it, expect } from "vitest"
import { OPEN_MODE, PAGE_ACTION_OPEN_MODE } from "@/const"
import {
  PAGE_ACTION_MODES,
  SEARCH_MODES,
} from "./OpenModeToggleField"

describe("OpenModeToggleField modes", () => {
  it("OM-01: PAGE_ACTION_MODES includes SIDE_PANEL in non-Edge environment", () => {
    expect(PAGE_ACTION_MODES).toContain(PAGE_ACTION_OPEN_MODE.SIDE_PANEL)
    expect(PAGE_ACTION_MODES).toEqual([
      PAGE_ACTION_OPEN_MODE.POPUP,
      PAGE_ACTION_OPEN_MODE.WINDOW,
      PAGE_ACTION_OPEN_MODE.TAB,
      PAGE_ACTION_OPEN_MODE.BACKGROUND_TAB,
      PAGE_ACTION_OPEN_MODE.CURRENT_TAB,
      PAGE_ACTION_OPEN_MODE.SIDE_PANEL,
    ])
  })

  it("OM-02: SEARCH_MODES includes SIDE_PANEL in non-Edge environment", () => {
    expect(SEARCH_MODES).toContain(OPEN_MODE.SIDE_PANEL)
    expect(SEARCH_MODES).toEqual([
      OPEN_MODE.POPUP,
      OPEN_MODE.WINDOW,
      OPEN_MODE.TAB,
      OPEN_MODE.BACKGROUND_TAB,
      OPEN_MODE.SIDE_PANEL,
    ])
  })

  it("OM-03: PAGE_ACTION_OPEN_MODE.SIDE_PANEL equals OPEN_MODE.SIDE_PANEL", () => {
    expect(PAGE_ACTION_OPEN_MODE.SIDE_PANEL).toBe(OPEN_MODE.SIDE_PANEL)
    expect(PAGE_ACTION_OPEN_MODE.SIDE_PANEL).toBe("sidePanel")
  })
})

