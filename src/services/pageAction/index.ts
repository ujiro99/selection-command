export { PageActionListener } from './listener'
export { PageActionDispatcher, SelectorType } from './dispatcher'
export type { PageActionProps } from './dispatcher'
export * as PageActionBackground from './background'

export const LocaleKey = 'PageAction_InputMenu_mark_'

export enum INSERT {
  SELECTED_TEXT = 'selectedText',
  URL = 'url',
  CLIPBOARD = 'clipboard',
}

export const InsertMark = {
  [INSERT.SELECTED_TEXT]: 'SelectedText',
  [INSERT.URL]: 'Url',
  [INSERT.CLIPBOARD]: 'Clipboard',
}
