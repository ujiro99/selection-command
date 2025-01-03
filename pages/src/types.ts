import type { OPEN_MODE, SPACE_ENCODING } from '@/const'

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

export type Analytics = {
  id: string
  download: number
  star: number
}

export type Tag = {
  id: string
  name: string
}
