import { t } from '@/services/i18n'
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

export const InsertSymbol = {
  [INSERT.SELECTED_TEXT]: 'SelectedText',
  [INSERT.URL]: 'Url',
  [INSERT.CLIPBOARD]: 'Clipboard',
}

export function convReadableKeysToSymbols(value: string): string {
  const symbols = {
    [t(LocaleKey + INSERT.SELECTED_TEXT)]: InsertSymbol[INSERT.SELECTED_TEXT],
    [t(LocaleKey + INSERT.URL)]: InsertSymbol[INSERT.URL],
    [t(LocaleKey + INSERT.CLIPBOARD)]: InsertSymbol[INSERT.CLIPBOARD],
  }
  Object.entries(symbols).forEach(([key, val]) => {
    value = value!.replace(new RegExp(key, 'g'), val)
  })
  return value
}

export function convSymbolsToReadableKeys(value: string): string {
  const symbols = {
    [InsertSymbol[INSERT.SELECTED_TEXT]]: t(LocaleKey + INSERT.SELECTED_TEXT),
    [InsertSymbol[INSERT.URL]]: t(LocaleKey + INSERT.URL),
    [InsertSymbol[INSERT.CLIPBOARD]]: t(LocaleKey + INSERT.CLIPBOARD),
  }
  Object.entries(symbols).forEach(([key, val]) => {
    value = value!.replace(new RegExp(key, 'g'), val)
  })
  return value
}
