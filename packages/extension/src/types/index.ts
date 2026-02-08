import type {
  OPEN_MODE,
  DRAG_OPEN_MODE,
  POPUP_ENABLED,
  SIDE,
  ALIGN,
  STYLE,
  KEYBOARD,
  STARTUP_METHOD,
  SPACE_ENCODING,
  STYLE_VARIABLE,
  LINK_COMMAND_ENABLED,
  LINK_COMMAND_STARTUP_METHOD,
  PAGE_ACTION_EVENT,
  PAGE_ACTION_CONTROL,
  PAGE_ACTION_OPEN_MODE,
  PAGE_ACTION_EXEC_STATE,
  ExecState,
  SHORTCUT_NO_SELECTION_BEHAVIOR,
} from "@/const"
import type { PageAction } from "@/services/pageAction"
import { INHERIT } from "@/const"

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type Version = `${number}.${number}.${number}`

export type Point = {
  x: number
  y: number
}

export type Command = SelectionCommand | LinkCommand

export type SelectionCommand =
  | SearchCommand
  | CopyCommand
  | ApiCommand
  | PageActionCommand

export type SearchCommand = {
  id: string
  title: string
  revision?: number
  iconUrl: string
  openMode: OPEN_MODE
  openModeSecondary?: OPEN_MODE
  searchUrl?: string
  parentFolderId?: string
  popupOption?: PopupOption
  spaceEncoding?: SPACE_ENCODING
}

export type CopyCommand = SearchCommand & {
  copyOption: CopyOption
}

export type ApiCommand = SearchCommand & {
  fetchOptions: string
  variables: Array<CommandVariable>
}

export type PageActionCommand = SearchCommand & {
  pageActionOption: PageActionOption
}

export type LinkCommand = Omit<SelectionCommand, "openMode"> & {
  openMode: DRAG_OPEN_MODE
}

export type PopupOption = {
  width: number
  height: number
}

export type CopyOption = "default" | "text"

type LinkCommandStartupMethod = {
  method: LINK_COMMAND_STARTUP_METHOD
  threshold?: number
  keyboardParam?: KEYBOARD
  leftClickHoldParam?: number
}

type LinkCommandSettings = {
  enabled: Exclude<LINK_COMMAND_ENABLED, LINK_COMMAND_ENABLED.INHERIT>
  openMode: DRAG_OPEN_MODE
  showIndicator: boolean
  startupMethod: LinkCommandStartupMethod
}

export type CommandFolder = {
  id: string
  title: string
  iconUrl?: string
  iconSvg?: string
  onlyIcon?: boolean
  parentFolderId?: string
}

export type CommandVariable = {
  name: string
  value: string
}

export type UserVariable = {
  name: string
  value: string
}

export type PopupPlacement = {
  side: SIDE
  align: ALIGN
  sideOffset: number
  alignOffset: number
}

export type PopupPlacementOrInherit = PopupPlacement | typeof INHERIT

export type PageRule = {
  urlPattern: string
  popupEnabled: POPUP_ENABLED
  popupPlacement: PopupPlacementOrInherit
  linkCommandEnabled: LINK_COMMAND_ENABLED
}

export type StyleVariable = {
  name: STYLE_VARIABLE
  value: string
}

export type StartupMethod = {
  method: STARTUP_METHOD
  keyboardParam?: KEYBOARD
  leftClickHoldParam?: number
}

export type Star = {
  id: string
}

type UserStars = {
  stars: Array<Star>
}

export type UserStats = {
  commandExecutionCount: number
  hasShownReviewRequest: boolean
  hasDismissedPromptHistoryBanner: boolean
}

export type ShortcutCommand = {
  id: string
  commandId: string
  noSelectionBehavior: SHORTCUT_NO_SELECTION_BEHAVIOR
}

export type ShortcutSettings = {
  shortcuts: Array<ShortcutCommand>
}

export type UserSettings = {
  settingVersion: Version
  startupMethod: StartupMethod
  popupPlacement: PopupPlacement
  popupAutoCloseDelay?: number
  commands: Array<Command>
  linkCommand: LinkCommandSettings
  folders: Array<CommandFolder>
  pageRules: Array<PageRule>
  style: STYLE
  userStyles: Array<StyleVariable>
  shortcuts: ShortcutSettings
}

export type SettingsType = UserSettings & UserStats & UserStars

export type SessionData = {
  session_id: string
  timestamp: number
}

export type ExecuteCommandParams = {
  command: Command | SelectionCommand
  position: { x: number; y: number } | null
  selectionText: string
  target?: Element | null
  useSecondary?: boolean
  useClipboard?: boolean
  changeState?: (state: ExecState, message?: string) => void
}

export type ActionTypes = PAGE_ACTION_EVENT | PAGE_ACTION_CONTROL
export type PageActionStep = {
  id: string
  timestamp?: number
  delayMs: number
  skipRenderWait: boolean
  param: PageAction.Parameter
}

export type PageActionOption = {
  startUrl: string
  openMode: PAGE_ACTION_OPEN_MODE
  steps: Array<PageActionStep>
  userVariables?: Array<UserVariable>
}

export type PageActionRecorderOption = {
  controllerPosition: Point
}

export type PageActionRecordingData = {
  size: PopupOption
} & PageActionOption

export type PageActionContext = {
  recordingTabId?: number
  isRecording?: boolean
  isRunning?: boolean
  urlChanged?: boolean
  status?: PageActionStatus
}

export type PageActiontResult = {
  status: PAGE_ACTION_EXEC_STATE
  stepId: string
  type: PAGE_ACTION_EVENT | PAGE_ACTION_CONTROL
  label: string
  message?: string
  duration: number
}

export type PageActionStatus = {
  tabId: number
  stepId: string
  results: PageActiontResult[]
}
export type MultiTabPageActionStatus = {
  [tabId: number]: PageActionStatus
}

export type WindowType = {
  id: number
  commandId: string
  srcWindowId: number
}

export type WindowLayer = WindowType[]

export type UrlParam = {
  searchUrl: string
  selectionText: string
  spaceEncoding?: SPACE_ENCODING
  useClipboard?: boolean
}

export type ShowToastParam = {
  title: string
  description: string
  action: string
}

export type Caches = {
  images: ImageCache
}

export type ImageCache = {
  [id: string]: string // key: url or uuid, value: data:image/png;base64
}
