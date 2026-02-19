/**
 * Shared open mode constants used across packages
 */
export enum OPEN_MODE {
  POPUP = "popup",
  WINDOW = "window",
  TAB = "tab",
  BACKGROUND_TAB = "backgroundTab",
  API = "api",
  PAGE_ACTION = "pageAction",
  LINK_POPUP = "linkPopup",
  COPY = "copy",
  GET_TEXT_STYLES = "getTextStyles",
  OPTION = "option",
  ADD_PAGE_RULE = "addPageRule",
}

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
  CURRENT_TAB = "currentTab",
}
