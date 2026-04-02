export { PageActionListener } from "./listener"
export { PageActionDispatcher } from "./dispatcher"
export { BackgroundPageActionDispatcher } from "./backgroundDispatcher"
export type { PageAction } from "./dispatcher"
export { RunningStatus } from "./status"
export * from "./helper"

export enum INSERT {
  SELECTED_TEXT = "selectedText",
  URL = "url",
  CLIPBOARD = "clipboard",
  LANG = "lang",
}

export const InsertSymbol = {
  [INSERT.SELECTED_TEXT]: "SelectedText",
  [INSERT.URL]: "Url",
  [INSERT.CLIPBOARD]: "Clipboard",
  [INSERT.LANG]: "Lang",
}

/** Returns the template placeholder string for a given INSERT key, e.g. "{{Clipboard}}" */
export const toInsertTemplate = (key: INSERT): string =>
  `{{${InsertSymbol[key]}}}`
