import type {
  OPEN_MODE,
  SPACE_ENCODING,
  PAGE_ACTION_OPEN_MODE,
  SelectorType,
} from '@/const'
import type { LanguageType } from '@/features/locale'

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

/*
 * Page Action Command
 */
enum PAGE_ACTION_EVENT {
  click = 'click',
  doubleClick = 'doubleClick',
  tripleClick = 'tripleClick',
  keyboard = 'keyboard',
  scroll = 'scroll',
  input = 'input',
}

enum PAGE_ACTION_CONTROL {
  start = 'start',
  end = 'end',
}

type ActionTypes = PAGE_ACTION_EVENT | PAGE_ACTION_CONTROL

export namespace PageAction {
  export type Parameter = Start | Click | Input | Keyboard | Scroll

  export type Start = {
    label: string
    url?: string
  }

  export type Click = {
    label: string
    selector: string
    selectorType: SelectorType
  }

  export type Input = {
    label: string
    selector: string
    selectorType: SelectorType
    value: string
    srcUrl: string
    selectedText: string
    clipboardText: string
  }

  export type Keyboard = {
    label: string
    key: string
    code: string
    keyCode: number
    shiftKey: boolean
    ctrlKey: boolean
    altKey: boolean
    metaKey: boolean
    targetSelector: string
    selectorType: SelectorType
  }

  export type Scroll = {
    label: string
    x: number
    y: number
  }
}

export type PageActionStep = {
  id: string
  type: ActionTypes
  param: PageAction.Parameter
}

type PageActionOption = {
  startUrl: string
  openMode: PAGE_ACTION_OPEN_MODE
  steps: Array<PageActionStep>
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

export type LangType = LanguageType

export type LangProps = {
  lang: LanguageType
}
