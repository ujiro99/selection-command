import {
  SelectorType,
  PAGE_ACTION_EVENT,
  PAGE_ACTION_CONTROL,
  PAGE_ACTION_CONDITION_ACTION,
  PAGE_ACTION_CONDITION_TYPE,
} from "@/const"
import type { UserVariable } from "@/types"

export namespace PageAction {
  export type Parameter =
    | Start
    | End
    | Navigate
    | Click
    | Input
    | FilePaste
    | Keyboard
    | Scroll

  export type Start = {
    type: PAGE_ACTION_CONTROL.start
    label: string
    url?: string
    mode?: "pageAction" | "aiPrompt"
  }

  export type End = {
    type: PAGE_ACTION_CONTROL.end
    label: string
  }

  export type Navigate = {
    type: PAGE_ACTION_CONTROL.navigate
    label: string
    url: string
  }

  export type ClickCondition = {
    actionType: PAGE_ACTION_CONDITION_ACTION
    conditionType: PAGE_ACTION_CONDITION_TYPE
    selector: string
    selectorType: SelectorType
    // Only meaningful for actionType=waitUntil; controls how long to poll
    // before giving up. Set by the caller so all timing values (this and
    // step delayMs) are controlled centrally at the call site.
    timeout?: number
  }

  export type Click = {
    type:
      | PAGE_ACTION_EVENT.click
      | PAGE_ACTION_EVENT.doubleClick
      | PAGE_ACTION_EVENT.tripleClick
    label: string
    selector: string
    selectorType: SelectorType
    condition?: ClickCondition
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
    userVariables?: UserVariable[]
    pageHtml?: string
    selectionHtml?: string
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

  export type FilePaste = {
    type: PAGE_ACTION_EVENT.filePaste
    label: string
    selector: string
    selectorType: SelectorType
    value: string
    fileName: string
    fileType: string
  }

  export type FilePasteExec = FilePaste & {
    pageHtml?: string
    selectionHtml?: string
  }

  export type Scroll = {
    type: PAGE_ACTION_EVENT.scroll
    label: string
    x: number
    y: number
  }
}

export type ActionReturn = Promise<[boolean, string?]>
