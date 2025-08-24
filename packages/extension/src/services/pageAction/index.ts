export { PageActionListener } from "./listener"
export { PageActionDispatcher } from "./dispatcher"
export { BackgroundPageActionDispatcher } from "./backgroundDispatcher"
export type { PageAction } from "./dispatcher"
export { RunningStatus, MultiTabRunningStatus } from "./status"
export * from "./helper"

export enum INSERT {
  SELECTED_TEXT = "selectedText",
  URL = "url",
  CLIPBOARD = "clipboard",
}

export const InsertSymbol = {
  [INSERT.SELECTED_TEXT]: "SelectedText",
  [INSERT.URL]: "Url",
  [INSERT.CLIPBOARD]: "Clipboard",
}
