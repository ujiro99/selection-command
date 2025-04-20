export enum OPEN_MODE {
  POPUP = 'popup',
  WINDOW = 'window',
  TAB = 'tab',
  PAGE_ACTION = 'pageAction',
}

export enum SPACE_ENCODING {
  PLUS = 'plus',
  PERCENT = 'percent',
}

export enum SORT_ORDER {
  searchUrl = 'searchUrl',
  title = 'title',
  download = 'download',
  star = 'star',
  addedAt = 'addedAt',
}

export enum PAGE_ACTION_OPEN_MODE {
  NONE = 'none',
  POPUP = OPEN_MODE.POPUP,
  TAB = OPEN_MODE.TAB,
}

export enum PAGE_ACTION_EVENT {
  click = 'click',
  doubleClick = 'doubleClick',
  tripleClick = 'tripleClick',
  keyboard = 'keyboard',
  scroll = 'scroll',
  input = 'input',
}

export enum PAGE_ACTION_CONTROL {
  start = 'start',
  end = 'end',
}

export enum SelectorType {
  css = 'css',
  xpath = 'xpath',
}

export const PAGE_ACTION_MAX = 12 // 10 actions + 1 start + 1 end

const environment = process.env.NODE_ENV || 'development'
export const isDebug = environment === 'development'

export const HUB_URL = isDebug
  ? 'http://localhost:3000'
  : 'https://ujiro99.github.io/selection-command'
