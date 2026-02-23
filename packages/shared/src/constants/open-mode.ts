/**
 * Shared open mode constants used across packages
 */
export enum OPEN_MODE {
  POPUP = "popup",
  WINDOW = "window",
  TAB = "tab",
  BACKGROUND_TAB = "backgroundTab",
  SIDE_PANEL = "sidePanel",
  API = "api",
  PAGE_ACTION = "pageAction",
  LINK_POPUP = "linkPopup",
  COPY = "copy",
  GET_TEXT_STYLES = "getTextStyles",
  OPTION = "option",
  ADD_PAGE_RULE = "addPageRule",
}

/**
 * Open modes that are valid for search commands
 */
export const SEARCH_OPEN_MODE = [
  OPEN_MODE.POPUP,
  OPEN_MODE.TAB,
  OPEN_MODE.BACKGROUND_TAB,
  OPEN_MODE.WINDOW,
  OPEN_MODE.SIDE_PANEL,
] as const;

export enum SPACE_ENCODING {
  PLUS = "plus",
  PERCENT = "percent",
}

export enum PAGE_ACTION_OPEN_MODE {
  NONE = "none",
  POPUP = OPEN_MODE.POPUP,
  TAB = OPEN_MODE.TAB,
  BACKGROUND_TAB = OPEN_MODE.BACKGROUND_TAB,
  WINDOW = OPEN_MODE.WINDOW,
}
