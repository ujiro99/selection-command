import { OPEN_MODE, PAGE_ACTION_OPEN_MODE } from "@shared"
export { OPEN_MODE, PAGE_ACTION_OPEN_MODE }

export const APP_ID = "selection-command"
export const VERSION = __APP_VERSION__ as string

/**
 * Setting value to switch the debug log output from this module.
 * true: enables all log. | false: disables debug log.
 */
const environment = import.meta.env.MODE ?? "development"
export const isDebug = environment === "development"
export const isE2E = environment === "e2e"

// Abstract command types for simplified command creation
export enum COMMAND_TYPE {
  SEARCH = "search",
  PAGE_ACTION = "pageAction",
  COPY = "copy",
  LINK_POPUP = "linkPopup",
  GET_TEXT_STYLES = "getTextStyles",
  API = "api",
  OPTION = "option",
}

export const OPEN_MODE_TYPE_MAP = {
  [OPEN_MODE.POPUP]: COMMAND_TYPE.SEARCH,
  [OPEN_MODE.WINDOW]: COMMAND_TYPE.SEARCH,
  [OPEN_MODE.TAB]: COMMAND_TYPE.SEARCH,
  [OPEN_MODE.BACKGROUND_TAB]: COMMAND_TYPE.SEARCH,
  [OPEN_MODE.SIDE_PANEL]: COMMAND_TYPE.SEARCH,
  [OPEN_MODE.API]: COMMAND_TYPE.API,
  [OPEN_MODE.PAGE_ACTION]: COMMAND_TYPE.PAGE_ACTION,
  [OPEN_MODE.LINK_POPUP]: COMMAND_TYPE.LINK_POPUP,
  [OPEN_MODE.COPY]: COMMAND_TYPE.COPY,
  [OPEN_MODE.GET_TEXT_STYLES]: COMMAND_TYPE.GET_TEXT_STYLES,
  [OPEN_MODE.OPTION]: COMMAND_TYPE.OPTION,
  [OPEN_MODE.ADD_PAGE_RULE]: COMMAND_TYPE.OPTION,
} as const

// Reverse mapping: COMMAND_TYPE -> OPEN_MODE[]
export const COMMAND_TYPE_OPEN_MODES_MAP = {
  [COMMAND_TYPE.SEARCH]: [
    OPEN_MODE.POPUP,
    OPEN_MODE.WINDOW,
    OPEN_MODE.TAB,
    OPEN_MODE.BACKGROUND_TAB,
    OPEN_MODE.SIDE_PANEL,
  ],
  [COMMAND_TYPE.API]: [OPEN_MODE.API],
  [COMMAND_TYPE.PAGE_ACTION]: [OPEN_MODE.PAGE_ACTION],
  [COMMAND_TYPE.LINK_POPUP]: [OPEN_MODE.LINK_POPUP],
  [COMMAND_TYPE.COPY]: [OPEN_MODE.COPY],
  [COMMAND_TYPE.GET_TEXT_STYLES]: [OPEN_MODE.GET_TEXT_STYLES],
  [COMMAND_TYPE.OPTION]: [OPEN_MODE.OPTION, OPEN_MODE.ADD_PAGE_RULE],
} as const

// Metadata for command types
export const COMMAND_TYPE_METADATA = {
  [COMMAND_TYPE.SEARCH]: {
    iconName: "Search",
    titleKey: "commandType_search_title",
    descKey: "commandType_search_desc",
  },
  [COMMAND_TYPE.PAGE_ACTION]: {
    iconName: "Play",
    titleKey: "commandType_pageAction_title",
    descKey: "commandType_pageAction_desc",
  },
  [COMMAND_TYPE.COPY]: {
    iconName: "Copy",
    titleKey: "commandType_copy_title",
    descKey: "commandType_copy_desc",
  },
  [COMMAND_TYPE.LINK_POPUP]: {
    iconName: "Link",
    titleKey: "commandType_linkPopup_title",
    descKey: "commandType_linkPopup_desc",
  },
  [COMMAND_TYPE.GET_TEXT_STYLES]: {
    iconName: "Paintbrush",
    titleKey: "commandType_getTextStyles_title",
    descKey: "commandType_getTextStyles_desc",
  },
  [COMMAND_TYPE.API]: {
    iconName: "Code",
    titleKey: "commandType_api_title",
    descKey: "commandType_api_desc",
  },
  // For type safety, even if not displayed.
  [COMMAND_TYPE.OPTION]: {
    iconName: "EllipsisVertical",
    titleKey: "",
    descKey: "",
  },
} as const

// Command type groups for organized display
export const COMMAND_TYPE_GROUPS = [
  {
    titleKey: "commandGroup_webPage_title",
    types: [COMMAND_TYPE.SEARCH, COMMAND_TYPE.PAGE_ACTION],
  },
  {
    titleKey: "commandGroup_singleFunction_title",
    types: [
      COMMAND_TYPE.COPY,
      COMMAND_TYPE.LINK_POPUP,
      COMMAND_TYPE.GET_TEXT_STYLES,
    ],
  },
  {
    titleKey: "commandGroup_experimental_title",
    types: [COMMAND_TYPE.API],
  },
] as const

/**
 * Background script only supports the following modes.
 * Modes that can operate without text selection.
 */
export enum OPEN_MODE_BG {
  POPUP = OPEN_MODE.POPUP,
  WINDOW = OPEN_MODE.WINDOW,
  TAB = OPEN_MODE.TAB,
  BACKGROUND_TAB = OPEN_MODE.BACKGROUND_TAB,
  SIDE_PANEL = OPEN_MODE.SIDE_PANEL,
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
  PREVIEW_SIDE_PANEL = "previewSidePanel",
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

export enum WINDOW_STATE {
  NORMAL = "normal",
  MAXIMIZED = "maximized",
  FULLSCREEN = "fullscreen",
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
  FONT_COLOR = "font-color",
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
