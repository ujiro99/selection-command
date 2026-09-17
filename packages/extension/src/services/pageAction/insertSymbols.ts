// Kept in their own module, separate from index.ts's barrel exports, so
// callers that only need these template-placeholder symbols (e.g.
// onboardingCommand.ts) don't have to pull in listener.ts's side effect of
// registering a chrome.runtime.onMessage listener at import time (via
// @/services/ipc).
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

/** Returns the template placeholder string for a given INSERT key, e.g. "{{Clipboard}}" */
export const toInsertTemplate = (key: INSERT): string =>
  `{{${InsertSymbol[key]}}}`
