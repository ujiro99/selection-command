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
}

export type Analytics = {
  id: string
  download: string
}

export type Tag = {
  id: string
  name: string
}
