import { t } from '@/services/i18n'
import { INSERT, InsertSymbol, PageAction } from '@/services/pageAction'
import { PAGE_ACTION_EVENT, PAGE_ACTION_CONTROL } from '@/const'
import { getKeyLabel } from '@/services/pageAction/listener'

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

export const paramToStr = (param: PageAction.Parameter): string => {
  switch (param.type) {
    case PAGE_ACTION_CONTROL.start:
    case PAGE_ACTION_CONTROL.end:
    case PAGE_ACTION_EVENT.click:
    case PAGE_ACTION_EVENT.doubleClick:
    case PAGE_ACTION_EVENT.tripleClick:
      return param.label
    case PAGE_ACTION_EVENT.input:
      return param.value
    case PAGE_ACTION_EVENT.keyboard:
      return getKeyLabel(param)
    case PAGE_ACTION_EVENT.scroll:
      return `x: ${param.x}, y: ${param.y}`
  }
}
