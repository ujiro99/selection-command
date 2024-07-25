export const APP_ID = process.env.NAME
export const VERSION = process.env.VERSION

export enum OPEN_MODE {
  POPUP = 'popup',
  TAB = 'tab',
  API = 'api',
  LINK_POPUP = 'linkPopup',
  COPY = 'copy',
  OPTION = 'option',
  GET_TEXT_STYLES = 'getTextStyles',
}

export enum POPUP_ENABLED {
  ENABLE = 'Enable',
  DISABLE = 'Disable',
}

export enum STYLE {
  VERTICAL = 'vertical',
  HORIZONTAL = 'horizontal',
}

export enum OPTION_MSG {
  START = 'start',
  CHANGED = 'changed',
  SET_HEIGHT = 'setHeight',
  FETCH_ICON_URL = 'fetchIconUrl',
  RES_FETCH_ICON_URL = 'resFetchIconUrl',
}

export const ROOT_FOLDER = ''

/**
 * Setting value to switch the debug log output from this module.
 * true: enables all log. | false: disables debug log.
 */
const environment = process.env.NODE_ENV || 'development'
export const isDebug = environment === 'development'
