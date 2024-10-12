import type { Placement } from '@floating-ui/react'
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
