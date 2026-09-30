import Bowser from "bowser"
import { OPEN_MODE, PAGE_ACTION_OPEN_MODE, DRAG_OPEN_MODE } from "@/const"
import { isSidePanelSupported } from "@/services/sidePanelSupport"

const isEdge =
  typeof window !== "undefined" && Boolean(window.navigator?.userAgent)
    ? Bowser.getParser(window.navigator.userAgent).getBrowserName() ===
      "Microsoft Edge"
    : false

// SidePanel is not offered on Microsoft Edge, nor on browsers without the
// chrome.sidePanel API (e.g. Opera).
export const canUseSidePanel = (): boolean => !isEdge && isSidePanelSupported()

export const isSidePanelMode = (mode: string): boolean =>
  mode === OPEN_MODE.SIDE_PANEL || mode === PAGE_ACTION_OPEN_MODE.SIDE_PANEL

/**
 * Append the side panel mode when it is available.
 * On unsupported browsers it is still kept if it is the current value, so that
 * existing commands show their saved mode (as disabled) instead of nothing.
 */
const withSidePanel = <T extends string>(
  modes: T[],
  sidePanelMode: T,
  currentValue?: string,
): T[] =>
  canUseSidePanel() || currentValue === sidePanelMode
    ? [...modes, sidePanelMode]
    : modes

// Order of options
export const getSearchModes = (currentValue?: string): OPEN_MODE[] =>
  withSidePanel(
    [
      OPEN_MODE.POPUP,
      OPEN_MODE.WINDOW,
      OPEN_MODE.TAB,
      OPEN_MODE.BACKGROUND_TAB,
    ],
    OPEN_MODE.SIDE_PANEL,
    currentValue,
  )

export const getPageActionModes = (
  currentValue?: string,
): PAGE_ACTION_OPEN_MODE[] =>
  withSidePanel(
    [
      PAGE_ACTION_OPEN_MODE.POPUP,
      PAGE_ACTION_OPEN_MODE.WINDOW,
      PAGE_ACTION_OPEN_MODE.TAB,
      PAGE_ACTION_OPEN_MODE.BACKGROUND_TAB,
      PAGE_ACTION_OPEN_MODE.CURRENT_TAB,
    ],
    PAGE_ACTION_OPEN_MODE.SIDE_PANEL,
    currentValue,
  )

/**
 * Open modes for the link command.
 * Unlike the command open modes, Edge is not excluded here; only the
 * chrome.sidePanel API availability matters.
 */
export const getDragOpenModes = (currentValue?: string): DRAG_OPEN_MODE[] =>
  isSidePanelSupported() || currentValue === DRAG_OPEN_MODE.PREVIEW_SIDE_PANEL
    ? Object.values(DRAG_OPEN_MODE)
    : Object.values(DRAG_OPEN_MODE).filter(
        (mode) => mode !== DRAG_OPEN_MODE.PREVIEW_SIDE_PANEL,
      )
