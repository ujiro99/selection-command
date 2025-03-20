export const APP_ID = __APP_NAME__ as string
export const VERSION = __APP_VERSION__ as string

/**
 * Setting value to switch the debug log output from this module.
 * true: enables all log. | false: disables debug log.
 */
const environment = import.meta.env.MODE ?? 'development'
export const isDebug = environment === 'development'

export enum OPEN_MODE {
  POPUP = 'popup',
  WINDOW = 'window',
  TAB = 'tab',
  API = 'api',
  PAGE_ACTION = 'pageAction',
  LINK_POPUP = 'linkPopup',
  COPY = 'copy',
  GET_TEXT_STYLES = 'getTextStyles',
  OPTION = 'option',
  ADD_PAGE_RULE = 'addPageRule',
}

export enum DRAG_OPEN_MODE {
  PREVIEW_POPUP = 'previewPopup',
  PREVIEW_WINDOW = 'previewWindow',
}

export enum PAGE_ACTION_OPEN_MODE {
  POPUP = OPEN_MODE.POPUP,
  TAB = OPEN_MODE.TAB,
}

export enum POPUP_PLACEMENT {
  TOP = 'top',
  TOP_START = 'top-start',
  TOP_END = 'top-end',
  BOTTOM = 'bottom',
  BOTTOM_START = 'bottom-start',
  BOTTOM_END = 'bottom-end',
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
  SHIFT = 'Shift',
  CTRL = 'Control',
  ALT = 'Alt',
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
  INHERIT = 'Inherit',
  ENABLE = 'Enable',
  DISABLE = 'Disable',
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

export enum COPY_OPTION {
  DEFAULT = 'default',
  TEXT = 'text',
}

export enum OPTION_MSG {
  START = 'start',
  START_ACK = 'startAck',
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
  COMMAND_FORM = 'CommandForm',
}

export const POPUP_OPTION = {
  width: 600,
  height: 700,
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

export enum EXEC_STATE {
  Queue = 'Queue',
  Start = 'Start',
  Done = 'Done',
  Stop = 'Stop',
  Failed = 'Failed',
}

export const POPUP_OFFSET = 50

export const EXIT_DURATION = 100

export const ROOT_FOLDER = 'RootFolder'

export const OPTION_FOLDER = 'OptionFolder'

export const COMMAND_MAX = 100

export const HUB_URL = isDebug
  ? 'http://localhost:3000/'
  : 'https://ujiro99.github.io/selection-command/'

export const PAGE_ACTION_MAX = 12 // 10 actions + 1 start + 1 end
