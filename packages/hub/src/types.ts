import type {
  OPEN_MODE_SEARCH,
  OPEN_MODE_PAGE_ACTION,
  SPACE_ENCODING,
} from "@/const"
import type { LanguageType } from "@/features/locale"
import type { PageActionOption } from "@/types/pageAction"

export type Command = SelectionCommand & Analytics

export type SelectionCommand = SearchCommand | PageActionCommand

type OPEN_MODE = OPEN_MODE_SEARCH | OPEN_MODE_PAGE_ACTION

type BaseCommand = {
  id: string
  title: string
  openMode: OPEN_MODE
  description: string
  iconUrl: string
  tags: Tag[]
  addedAt: string
  revision?: number
}

export type SearchCommand = BaseCommand & {
  searchUrl: string
  openModeSecondary: OPEN_MODE
  spaceEncoding: SPACE_ENCODING
}

export type PageActionCommand = BaseCommand & {
  pageActionOption: PageActionOption
}

export type CommandInJson = Omit<SelectionCommand, "tags"> & {
  tags: string[]
}

export type CommandInMessage = Omit<
  SelectionCommand,
  "id" | "description" | "tags" | "addedAt" | "revision"
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
