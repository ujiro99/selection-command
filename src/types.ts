import type {
  OPEN_MODE,
  POPUP_ENABLED,
  STYLE,
  KEYBOARD,
  STARTUP_METHOD,
  SPACE_ENCODING,
  STYLE_VARIABLE,
} from '@/const'

export type Version = `${number}.${number}.${number}`

export type Command = {
  id: number
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

export type PopupOption = {
  width: number
  height: number
}

export type CopyOption = 'default' | 'text'

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

type Side = 'top' | 'right' | 'bottom' | 'left'
type Alignment = 'start' | 'end'
type AlignedPlacement = `${Side}-${Alignment}`
export type Placement = Side | AlignedPlacement

export type PageRule = {
  urlPattern: string
  popupEnabled: POPUP_ENABLED
  popupPlacement: Placement
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

export type UserSettingsType = {
  settingVersion: Version
  startupMethod: StartupMethod
  popupPlacement: Placement
  commands: Array<Command>
  folders: Array<CommandFolder>
  pageRules: Array<PageRule>
  style: STYLE
  userStyles: Array<StyleVariable>
}
