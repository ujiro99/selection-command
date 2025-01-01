import type {
  OPEN_MODE,
  DRAG_OPEN_MODE,
  POPUP_ENABLED,
  STYLE,
  KEYBOARD,
  STARTUP_METHOD,
  SPACE_ENCODING,
  STYLE_VARIABLE,
  LINK_COMMAND_ENABLED,
  LINK_COMMAND_STARTUP_METHOD,
} from '@/const'

export type Version = `${number}.${number}.${number}`

export type Point = {
  x: number
  y: number
}

export type Command = SelectionCommand | LinkCommand

export type SelectionCommand = {
  id: number | string
  title: string
  searchUrl: string
  iconUrl: string
  openMode: OPEN_MODE
  openModeSecondary?: OPEN_MODE
  parentFolder?: FolderOption // deprecated from v0.8.2
  parentFolderId?: string
  popupOption?: PopupOption
  copyOption?: CopyOption
  fetchOptions?: string
  variables?: Array<CommandVariable>
  spaceEncoding?: SPACE_ENCODING
}

export type LinkCommand = Omit<SelectionCommand, 'openMode'> & {
  openMode: DRAG_OPEN_MODE
}

export type PopupOption = {
  width: number
  height: number
}

export type CopyOption = 'default' | 'text'

type LinkCommandStartupMethod = {
  method: LINK_COMMAND_STARTUP_METHOD
  threshold?: number
  keyboardParam?: KEYBOARD
  leftClickHoldParam?: number
}

type LinkCommandSettings = {
  enabled: LINK_COMMAND_ENABLED
  openMode: DRAG_OPEN_MODE
  showIndicator: boolean
  startupMethod: LinkCommandStartupMethod
}

export type FolderOption = {
  id: string
  name: string
  iconUrl: string
}

export type CommandFolder = {
  id: string
  title: string
  iconUrl?: string
  onlyIcon?: boolean
}

export type CommandVariable = {
  name: string
  value: string
}

export type Side = 'top' | 'right' | 'bottom' | 'left'
export type Alignment = 'start' | 'end' | 'center'
type AlignedPlacement = `${Side}-${Alignment}`
export type Placement = Side | AlignedPlacement

export type PageRule = {
  urlPattern: string
  popupEnabled: POPUP_ENABLED
  popupPlacement: Placement
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

export type SettingsType = {
  settingVersion: Version
  startupMethod: StartupMethod
  popupPlacement: Placement
  commands: Array<Command>
  linkCommand: LinkCommandSettings
  folders: Array<CommandFolder>
  pageRules: Array<PageRule>
  style: STYLE
  userStyles: Array<StyleVariable>
  stars: Array<Star>
}

export type SessionData = {
  session_id: string
  timestamp: number
}
