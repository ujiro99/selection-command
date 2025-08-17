import type { PAGE_ACTION_OPEN_MODE, SelectorType } from "@/const"

/*
 * Page Action Command
 */
enum PAGE_ACTION_EVENT {
  click = "click",
  doubleClick = "doubleClick",
  tripleClick = "tripleClick",
  keyboard = "keyboard",
  scroll = "scroll",
  input = "input",
}

enum PAGE_ACTION_CONTROL {
  start = "start",
  end = "end",
}

export type Parameter = Start | End | Click | Input | Keyboard | Scroll

export type Start = {
  type: PAGE_ACTION_CONTROL.start
  label: string
  url?: string
}

export type End = {
  type: PAGE_ACTION_CONTROL.end
  label: string
}

export type Click = {
  type:
    | PAGE_ACTION_EVENT.click
    | PAGE_ACTION_EVENT.doubleClick
    | PAGE_ACTION_EVENT.tripleClick
  label: string
  selector: string
  selectorType: SelectorType
}

export type Input = {
  type: PAGE_ACTION_EVENT.input
  label: string
  selector: string
  selectorType: SelectorType
  value: string
}

export type InputExec = Input & {
  srcUrl: string
  selectedText: string
  clipboardText: string
}

export type Keyboard = {
  type: PAGE_ACTION_EVENT.keyboard
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
  type: PAGE_ACTION_EVENT.scroll
  label: string
  x: number
  y: number
}

export type PageActionStep = {
  id: string
  param: Parameter
}

export type PageActionOption = {
  startUrl: string
  openMode: PAGE_ACTION_OPEN_MODE
  steps: Array<PageActionStep>
}
