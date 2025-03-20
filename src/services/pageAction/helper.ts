import { t } from '@/services/i18n'
import { INSERT, InsertSymbol, PageAction } from '@/services/pageAction'

export const LocaleKey = 'PageAction_InputMenu_mark_'

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

export function isInputAction(
  param: PageAction.Parameter,
): param is PageAction.Input {
  return 'value' in param
}
