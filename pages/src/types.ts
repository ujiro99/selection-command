import type { OPEN_MODE, SPACE_ENCODING } from '@/const'
import type { LanguageType } from '@/features/locale'

export type Command = SelectionCommand & Analytics

export type SelectionCommand = {
  id: string
  title: string
  searchUrl: string
  iconUrl: string
  openMode: OPEN_MODE
  openModeSecondary: OPEN_MODE
  spaceEncoding: SPACE_ENCODING
  description: string
  tags: Tag[]
  addedAt: string
}

export type CommandInJson = Omit<SelectionCommand, 'tags'> & {
  tags: string[]
}

export type CommandInMessage = Omit<
  SelectionCommand,
  'id' | 'description' | 'tags' | 'addedAt'
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

export type LangProps = {
  lang: LanguageType
}
