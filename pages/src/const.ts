export enum OPEN_MODE {
  POPUP = 'popup',
  WINDOW = 'window',
  TAB = 'tab',
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

const environment = process.env.NODE_ENV || 'development'
export const isDebug = environment === 'development'

export const HUB_URL = isDebug
  ? 'http://localhost:3000'
  : 'https://ujiro99.github.io/selection-command'
