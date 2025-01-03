export const APP_ID = process.env.NAME as string
export const VERSION = process.env.VERSION

export enum OPEN_MODE {
  POPUP = 'popup',
  WINDOW = 'window',
  TAB = 'tab',
  API = 'api',
  LINK_POPUP = 'linkPopup',
  COPY = 'copy',
  OPTION = 'option',
  GET_TEXT_STYLES = 'getTextStyles',
  ADD_PAGE_RULE = 'addPageRule',
}

export enum DRAG_OPEN_MODE {
  PREVIEW_POPUP = 'previewPopup',
  PREVIEW_WINDOW = 'previewWindow',
}

export enum STARTUP_METHOD {
  TEXT_SELECTION = 'textSelection',
  CONTEXT_MENU = 'contextMenu',
  KEYBOARD = 'keyboard',
  LEFT_CLICK_HOLD = 'leftClickHold',
}

export enum POPUP_TYPE {
  NORMAL = 'normal',
  POPUP = 'popup',
}

export enum KEYBOARD {
  CTRL = 'Control',
  ALT = 'Alt',
  SHIFT = 'Shift',
  META = 'Meta',
}

export enum MOUSE {
  LEFT = 0,
  MIDDLE = 1,
  RIGHT = 2,
}

export enum POPUP_ENABLED {
  ENABLE = 'Enable',
  DISABLE = 'Disable',
}

export enum LINK_COMMAND_ENABLED {
  ENABLE = 'Enable',
  DISABLE = 'Disable',
  INHERIT = 'Inherit',
}

export enum LINK_COMMAND_STARTUP_METHOD {
  KEYBOARD = 'keyboard',
  DRAG = 'drag',
  LEFT_CLICK_HOLD = 'leftClickHold',
}

export enum STYLE {
  VERTICAL = 'vertical',
  HORIZONTAL = 'horizontal',
}

export enum SPACE_ENCODING {
  PLUS = 'plus',
  PERCENT = 'percent',
}

export enum OPTION_MSG {
  START = 'start',
  CHANGED = 'changed',
  JUMP = 'jump',
  FETCH_ICON_URL = 'fetchIconUrl',
  RES_FETCH_ICON_URL = 'resFetchIconUrl',
  KEY_INPUT = 'key_input',
  MOUSE = 'mouse',
  OPEN_LINK = 'openLink',
}

export enum STYLE_VARIABLE {
  BACKGROUND_COLOR = 'background-color',
  BORDER_COLOR = 'border-color',
  FONT_SCALE = 'font-scale',
  IMAGE_SCALE = 'image-scale',
  PADDING_SCALE = 'padding-scale',
  POPUP_DELAY = 'popup-delay',
  POPUP_DURATION = 'popup-duration',
}

export enum SCREEN {
  CONTENT_SCRIPT = 'ContentScript',
  OPTION = 'Option',
  SERVICE_WORKER = 'ServiceWorker',
  COMMAND_HUB = 'CommandHub',
}

export const POPUP_OFFSET = 50

export const EXIT_DURATION = 100

export const ROOT_FOLDER = ''
export const OPTION_FOLDER = 'OptionFolder'

export const COMMAND_MAX = 100

/**
 * Setting value to switch the debug log output from this module.
 * true: enables all log. | false: disables debug log.
 */
const environment = process.env.NODE_ENV || 'development'
export const isDebug = environment === 'development'

export const HUB_URL = isDebug
  ? 'http://localhost:3000/'
  : 'https://ujiro99.github.io/selection-command/'
