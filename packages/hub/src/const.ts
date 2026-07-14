import { OPEN_MODE as _OPEN_MODE, PAGE_ACTION_OPEN_MODE } from "@shared"
export { PAGE_ACTION_OPEN_MODE }

export enum OPEN_MODE_SEARCH {
  POPUP = _OPEN_MODE.POPUP,
  WINDOW = _OPEN_MODE.WINDOW,
  TAB = _OPEN_MODE.TAB,
  BACKGROUND_TAB = _OPEN_MODE.BACKGROUND_TAB,
  SIDE_PANEL = _OPEN_MODE.SIDE_PANEL,
}

export enum OPEN_MODE_PAGE_ACTION {
  PAGE_ACTION = _OPEN_MODE.PAGE_ACTION,
}

export const OPEN_MODE = {
  ...OPEN_MODE_SEARCH,
  ...OPEN_MODE_PAGE_ACTION,
}

export enum SPACE_ENCODING {
  PLUS = "plus",
  PERCENT = "percent",
}

export enum PAGE_ACTION_EVENT {
  click = "click",
  doubleClick = "doubleClick",
  tripleClick = "tripleClick",
  keyboard = "keyboard",
  scroll = "scroll",
  input = "input",
}

export enum PAGE_ACTION_CONTROL {
  start = "start",
  end = "end",
}

export enum SelectorType {
  css = "css",
  xpath = "xpath",
}

export const PAGE_ACTION_MAX = 12 // 10 actions + 1 start + 1 end

export const HUB_SRC_UUID = "019db85f-3c82-70b2-bd1e-f22d07ca4915"

// The full-featured Selection Command Hub, migrated to its own repository.
export const NEW_HUB_URL = "https://selection-command.com"
