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
  PAGE_HTML = "pageHtml",
  SELECTION_HTML = "selectionHtml",
}

export const InsertSymbol = {
  [INSERT.SELECTED_TEXT]: "SelectedText",
  [INSERT.URL]: "Url",
  [INSERT.CLIPBOARD]: "Clipboard",
  [INSERT.LANG]: "Lang",
  [INSERT.PAGE_HTML]: "PageHtml",
  [INSERT.SELECTION_HTML]: "SelectionHtml",
}

/** Maximum number of characters to include from PAGE_HTML before truncation (≈1MB). */
export const PAGE_HTML_MAX_CHARS = 1_000_000

/** Returns the template placeholder string for a given INSERT key, e.g. "{{Clipboard}}" */
export const toInsertTemplate = (key: INSERT): string =>
  `{{${InsertSymbol[key]}}}`
