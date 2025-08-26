export const APP_ID = "selection-command"
export const VERSION = __APP_VERSION__ as string

/**
 * Setting value to switch the debug log output from this module.
 * true: enables all log. | false: disables debug log.
 */
const environment = import.meta.env.MODE ?? "development"
export const isDebug = environment === "development"

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

// Abstract command categories for simplified command creation
export enum COMMAND_CATEGORY {
  SEARCH = "search",
  PAGE_ACTION = "pageAction",
  COPY = "copy",
  LINK_POPUP = "linkPopup",
  GET_TEXT_STYLES = "getTextStyles",
  API = "api",
}

// Metadata for command categories
export const COMMAND_CATEGORY_METADATA = {
  [COMMAND_CATEGORY.SEARCH]: {
    iconName: "Search",
    titleKey: "commandCategory_search_title",
    descKey: "commandCategory_search_desc",
  },
  [COMMAND_CATEGORY.PAGE_ACTION]: {
    iconName: "Play",
    titleKey: "commandCategory_pageAction_title",
    descKey: "commandCategory_pageAction_desc",
  },
  [COMMAND_CATEGORY.COPY]: {
    iconName: "Copy",
    titleKey: "commandCategory_copy_title",
    descKey: "commandCategory_copy_desc",
  },
  [COMMAND_CATEGORY.LINK_POPUP]: {
    iconName: "Link",
    titleKey: "commandCategory_linkPopup_title",
    descKey: "commandCategory_linkPopup_desc",
  },
  [COMMAND_CATEGORY.GET_TEXT_STYLES]: {
    iconName: "Paintbrush",
    titleKey: "commandCategory_getTextStyles_title",
    descKey: "commandCategory_getTextStyles_desc",
  },
  [COMMAND_CATEGORY.API]: {
    iconName: "Code",
    titleKey: "commandCategory_api_title",
    descKey: "commandCategory_api_desc",
  },
} as const

// Command category groups for organized display
export const COMMAND_CATEGORY_GROUPS = [
  {
    titleKey: "commandGroup_webPage_title",
    categories: [COMMAND_CATEGORY.SEARCH, COMMAND_CATEGORY.PAGE_ACTION],
  },
  {
    titleKey: "commandGroup_singleFunction_title",
    categories: [
      COMMAND_CATEGORY.COPY,
      COMMAND_CATEGORY.LINK_POPUP,
      COMMAND_CATEGORY.GET_TEXT_STYLES,
    ],
  },
  {
    titleKey: "commandGroup_experimental_title",
    categories: [COMMAND_CATEGORY.API],
  },
] as const

// Available OPEN_MODEs for command creation (excludes internal modes)
export const COMMAND_OPEN_MODES = [
  OPEN_MODE.POPUP,
  OPEN_MODE.WINDOW,
  OPEN_MODE.TAB,
  OPEN_MODE.BACKGROUND_TAB,
  OPEN_MODE.API,
  OPEN_MODE.PAGE_ACTION,
  OPEN_MODE.LINK_POPUP,
  OPEN_MODE.COPY,
  OPEN_MODE.GET_TEXT_STYLES,
] as const

/**
 * Background script only supports the following modes.
 * Modes that can operate without text selection.
 */
export enum OPEN_MODE_BG {
  POPUP = OPEN_MODE.POPUP,
  WINDOW = OPEN_MODE.WINDOW,
  TAB = OPEN_MODE.TAB,
  API = OPEN_MODE.API,
  PAGE_ACTION = OPEN_MODE.PAGE_ACTION,
}

export enum ExecState {
  NONE = 0,
  EXECUTING = 1,
  SUCCESS = 2,
  FAIL = 3,
}

export enum DRAG_OPEN_MODE {
  PREVIEW_POPUP = "previewPopup",
  PREVIEW_WINDOW = "previewWindow",
}

export enum PAGE_ACTION_OPEN_MODE {
  NONE = "none",
  POPUP = OPEN_MODE.POPUP,
  TAB = OPEN_MODE.TAB,
  BACKGROUND_TAB = OPEN_MODE.BACKGROUND_TAB,
  WINDOW = OPEN_MODE.WINDOW,
}

export enum SIDE {
  top = "top",
  right = "right",
  bottom = "bottom",
  left = "left",
}

export enum ALIGN {
  start = "start",
  center = "center",
  end = "end",
}

export enum STARTUP_METHOD {
  TEXT_SELECTION = "textSelection",
  KEYBOARD = "keyboard",
  LEFT_CLICK_HOLD = "leftClickHold",
  CONTEXT_MENU = "contextMenu",
}

export enum POPUP_TYPE {
  NORMAL = "normal",
  POPUP = "popup",
}

export enum KEYBOARD {
  SHIFT = "Shift",
  CTRL = "Control",
  ALT = "Alt",
  META = "Meta",
}

export enum MOUSE {
  LEFT = 0,
  MIDDLE = 1,
  RIGHT = 2,
}

export enum POPUP_ENABLED {
  ENABLE = "Enable",
  DISABLE = "Disable",
}

export const INHERIT = "inherit"

export enum LINK_COMMAND_ENABLED {
  INHERIT = "Inherit",
  ENABLE = "Enable",
  DISABLE = "Disable",
}

export enum LINK_COMMAND_STARTUP_METHOD {
  KEYBOARD = "keyboard",
  DRAG = "drag",
  LEFT_CLICK_HOLD = "leftClickHold",
}

export enum STYLE {
  HORIZONTAL = "horizontal",
  VERTICAL = "vertical",
}

export enum SPACE_ENCODING {
  PLUS = "plus",
  PERCENT = "percent",
}

export enum COPY_OPTION {
  DEFAULT = "default",
  TEXT = "text",
}

export enum OPTION_MSG {
  START = "start",
  START_ACK = "startAck",
  CHANGED = "changed",
  JUMP = "jump",
  FETCH_ICON_URL = "fetchIconUrl",
  RES_FETCH_ICON_URL = "resFetchIconUrl",
  KEY_INPUT = "key_input",
  MOUSE = "mouse",
  OPEN_LINK = "openLink",
}

export enum STYLE_VARIABLE {
  BACKGROUND_COLOR = "background-color",
  BORDER_COLOR = "border-color",
  FONT_SCALE = "font-scale",
  IMAGE_SCALE = "image-scale",
  PADDING_SCALE = "padding-scale",
  POPUP_DELAY = "popup-delay",
  POPUP_DURATION = "popup-duration",
}

export enum SCREEN {
  CONTENT_SCRIPT = "ContentScript",
  OPTION = "Option",
  SERVICE_WORKER = "ServiceWorker",
  COMMAND_HUB = "CommandHub",
  COMMAND_FORM = "CommandForm",
}

export const POPUP_OPTION = {
  width: 600,
  height: 700,
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

export enum PAGE_ACTION_EXEC_STATE {
  Queue = "Queue",
  Start = "Start",
  Doing = "Doing",
  Done = "Done",
  Stop = "Stop",
  Failed = "Failed",
}

export enum SelectorType {
  css = "css",
  xpath = "xpath",
}

export const POPUP_OFFSET = 50

export const EXIT_DURATION = 100

export const ROOT_FOLDER = "RootFolder"

export const OPTION_FOLDER = "OptionFolder"

export const ICON_NOT_FOUND =
  "https://cdn4.iconfinder.com/data/icons/fluent-solid-20px-vol-6/20/ic_fluent_square_hint_20_filled-512.png"

export const HUB_URL = isDebug
  ? "http://localhost:3000"
  : "https://ujiro99.github.io/selection-command"

export const PAGE_ACTION_MAX = 12 // 10 actions + 1 start + 1 end

export const PAGE_ACTION_TIMEOUT = 5000

export const OPTION_PAGE_PATH = "src/options_page.html"

export const COMMAND_USAGE = {
  REVIEW_THRESHOLD: 100,
  REVIEW_INTERVAL: 50,
  SETTING_KEY: {
    COMMAND_EXECUTION_COUNT: "commandExecutionCount",
    HAS_SHOWN_REVIEW_REQUEST: "hasShownReviewRequest",
  },
} as const

export const SHORTCUT_PLACEHOLDER = "_placeholder_"

export enum SHORTCUT_NO_SELECTION_BEHAVIOR {
  DO_NOTHING = "doNothing",
  USE_CLIPBOARD = "useClipboard",
}
