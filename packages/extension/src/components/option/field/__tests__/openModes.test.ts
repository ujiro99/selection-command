import { describe, it, expect, afterEach } from "vitest"
import { OPEN_MODE, PAGE_ACTION_OPEN_MODE, DRAG_OPEN_MODE } from "@/const"
import {
  getDragOpenModes,
  getPageActionModes,
  getSearchModes,
} from "../openModes"

const originalSidePanel = chrome.sidePanel

// Replace chrome.sidePanel to emulate browsers with/without the API.
const setSidePanel = (value: unknown) => {
  ;(chrome as unknown as { sidePanel: unknown }).sidePanel = value
}

const disableSidePanelApi = () => setSidePanel(undefined)

describe("openModes", () => {
  afterEach(() => {
    setSidePanel(originalSidePanel)
  })

  it("OM-01: getPageActionModes includes SIDE_PANEL in non-Edge environment", () => {
    expect(getPageActionModes()).toEqual([
      PAGE_ACTION_OPEN_MODE.POPUP,
      PAGE_ACTION_OPEN_MODE.WINDOW,
      PAGE_ACTION_OPEN_MODE.TAB,
      PAGE_ACTION_OPEN_MODE.BACKGROUND_TAB,
      PAGE_ACTION_OPEN_MODE.CURRENT_TAB,
      PAGE_ACTION_OPEN_MODE.SIDE_PANEL,
    ])
  })

  it("OM-02: getSearchModes includes SIDE_PANEL in non-Edge environment", () => {
    expect(getSearchModes()).toEqual([
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

  it("OM-04: SIDE_PANEL is excluded when side panel API is not supported", () => {
    disableSidePanelApi()

    expect(getSearchModes(OPEN_MODE.POPUP)).not.toContain(OPEN_MODE.SIDE_PANEL)
    expect(getPageActionModes(PAGE_ACTION_OPEN_MODE.POPUP)).not.toContain(
      PAGE_ACTION_OPEN_MODE.SIDE_PANEL,
    )
  })

  it("OM-05: SIDE_PANEL is kept when it is the current value on unsupported browsers", () => {
    disableSidePanelApi()

    expect(getSearchModes(OPEN_MODE.SIDE_PANEL)).toContain(OPEN_MODE.SIDE_PANEL)
    expect(getPageActionModes(PAGE_ACTION_OPEN_MODE.SIDE_PANEL)).toContain(
      PAGE_ACTION_OPEN_MODE.SIDE_PANEL,
    )
  })

  it("OM-06: getDragOpenModes includes PREVIEW_SIDE_PANEL when supported", () => {
    expect(getDragOpenModes()).toEqual(Object.values(DRAG_OPEN_MODE))
  })

  it("OM-07: getDragOpenModes excludes PREVIEW_SIDE_PANEL when not supported", () => {
    disableSidePanelApi()

    expect(getDragOpenModes(DRAG_OPEN_MODE.PREVIEW_POPUP)).not.toContain(
      DRAG_OPEN_MODE.PREVIEW_SIDE_PANEL,
    )
  })

  it("OM-08: getDragOpenModes keeps PREVIEW_SIDE_PANEL when it is the current value", () => {
    disableSidePanelApi()

    expect(getDragOpenModes(DRAG_OPEN_MODE.PREVIEW_SIDE_PANEL)).toContain(
      DRAG_OPEN_MODE.PREVIEW_SIDE_PANEL,
    )
  })
})
