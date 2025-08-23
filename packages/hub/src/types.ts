import type { OPEN_MODE, SPACE_ENCODING } from "@/const"
import type { LanguageType } from "@/features/locale"
import type { PageActionOption } from "@/types/pageAction"

export type Command = SelectionCommand & Analytics

export type SelectionCommand = SearchCommand | PageActionCommand

export type SearchCommand = {
  id: string
  title: string
  description: string
  tags: Tag[]
  addedAt: string
  openMode: OPEN_MODE
  searchUrl: string
  iconUrl: string
  openModeSecondary: OPEN_MODE
  spaceEncoding: SPACE_ENCODING
}

export type PageActionCommand = {
  id: string
  title: string
  description: string
  tags: Tag[]
  addedAt: string
  openMode: OPEN_MODE
  iconUrl: string
  pageActionOption: PageActionOption
}

export type CommandInJson = Omit<SelectionCommand, "tags"> & {
  tags: string[]
}

export type CommandInMessage = Omit<
  SelectionCommand,
  "id" | "description" | "tags" | "addedAt"
>

export type Analytics = {
  id: string
  download: number
  star: number
}

export type Tag = {
  id: string
  name: string
}

export type LangType = LanguageType

export type LangProps = {
  lang: LanguageType
}

export type UninstallFormType = {
  uninstallReason: string[]
  wantedToUse: string[]
  otherReason?: string
  otherWantedToUse?: string
  details: string
  locale: string
}
