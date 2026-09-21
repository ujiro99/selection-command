import { t } from "@/services/i18n"
import {
  INSERT,
  InsertSymbol,
  PageAction,
  toInsertTemplate,
} from "@/services/pageAction"
import { PAGE_ACTION_EVENT, PAGE_ACTION_CONTROL } from "@/const"
import { getKeyLabel } from "@/services/pageAction/listener"

import { safeInterpolate } from "@/lib/utils"
import { getUILanguage } from "@/services/i18n"
import type { UserVariable } from "@/types"

export const LocaleKey = "PageAction_InputMenu_mark_"

/** Counts the total occurrences of HTML attachment placeholders (PageHtml + SelectionHtml) in a prompt. */
export const countHtmlAttachments = (prompt: string): number => {
  const count = (needle: string) => prompt.split(needle).length - 1
  return (
    count(toInsertTemplate(INSERT.PAGE_HTML)) +
    count(toInsertTemplate(INSERT.SELECTION_HTML))
  )
}

/**
 * Matches a single `{{...}}` placeholder. The inner name is captured as-is
 * because readable labels contain spaces, unlike the `\w+` names that
 * `safeInterpolate` resolves at runtime.
 */
const PLACEHOLDER_PATTERN = /\{\{([^{}]*)\}\}/g

/**
 * Rewrites the name inside each `{{...}}` placeholder using the given map.
 * Only a whole placeholder name is looked up, so a user variable whose name
 * merely contains a built-in symbol (e.g. `Language`, `MyUrl`) is left alone.
 */
function convPlaceholderNames(
  value: string | null | undefined,
  names: Record<string, string>,
): string {
  return (value ?? "").replace(PLACEHOLDER_PATTERN, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(names, name)
      ? `{{${names[name]}}}`
      : match,
  )
}

export function convReadableKeysToSymbols(value?: string | null): string {
  return convPlaceholderNames(value, {
    [t(LocaleKey + INSERT.SELECTED_TEXT)]: InsertSymbol[INSERT.SELECTED_TEXT],
    [t(LocaleKey + INSERT.URL)]: InsertSymbol[INSERT.URL],
    [t(LocaleKey + INSERT.CLIPBOARD)]: InsertSymbol[INSERT.CLIPBOARD],
    [t(LocaleKey + INSERT.LANG)]: InsertSymbol[INSERT.LANG],
    [t(LocaleKey + INSERT.PAGE_HTML)]: InsertSymbol[INSERT.PAGE_HTML],
    [t(LocaleKey + INSERT.SELECTION_HTML)]: InsertSymbol[INSERT.SELECTION_HTML],
  })
}

export function convSymbolsToReadableKeys(value?: string | null): string {
  return convPlaceholderNames(value, {
    [InsertSymbol[INSERT.SELECTED_TEXT]]: t(LocaleKey + INSERT.SELECTED_TEXT),
    [InsertSymbol[INSERT.URL]]: t(LocaleKey + INSERT.URL),
    [InsertSymbol[INSERT.CLIPBOARD]]: t(LocaleKey + INSERT.CLIPBOARD),
    [InsertSymbol[INSERT.LANG]]: t(LocaleKey + INSERT.LANG),
    [InsertSymbol[INSERT.PAGE_HTML]]: t(LocaleKey + INSERT.PAGE_HTML),
    [InsertSymbol[INSERT.SELECTION_HTML]]: t(LocaleKey + INSERT.SELECTION_HTML),
  })
}

export type ResolveActionVariablesParams = {
  value: string
  selectedText?: string
  srcUrl?: string
  clipboardText?: string
  userVariables?: Array<UserVariable>
}

/**
 * Builds the built-in variables available to every Page Action template.
 */
const buildBuiltinVariables = (params: {
  selectedText: string
  srcUrl: string
  clipboardText: string
}): Record<string, string> => ({
  [InsertSymbol[INSERT.SELECTED_TEXT]]: params.selectedText,
  [InsertSymbol[INSERT.URL]]: params.srcUrl,
  [InsertSymbol[INSERT.CLIPBOARD]]: params.clipboardText,
  [InsertSymbol[INSERT.LANG]]: getUILanguage(),
})

/**
 * Resolves user variables in definition order. Each value may reference the
 * built-in variables and any user variable defined before it; a reference to a
 * later or unknown variable is left as a literal placeholder. Interpolating
 * each value exactly once keeps resolution non-recursive and always terminating.
 */
export function resolveUserVariables(
  builtinVariables: Record<string, string>,
  userVariables?: Array<UserVariable>,
): Record<string, string> {
  const resolved = { ...builtinVariables }
  for (const variable of userVariables ?? []) {
    resolved[variable.name] = safeInterpolate(variable.value, resolved)
  }
  return resolved
}

/**
 * Checks whether a template contains the given placeholder, following
 * references into user variables. A step that uses `{{MyVar}}` needs the
 * clipboard when `MyVar`'s own value uses `{{Clipboard}}`, so the caller can
 * decide up front whether reading the clipboard is necessary. References
 * inside each user variable follow the same definition-order rules as
 * `resolveUserVariables`: only variables defined before it are available.
 */
export function templateReferencesInsert(
  value: string,
  insert: INSERT,
  userVariables?: Array<UserVariable>,
): boolean {
  if (value.includes(toInsertTemplate(insert))) return true

  const referencesByName = new Map<string, boolean>()
  for (const variable of userVariables ?? []) {
    const referencesInsert =
      variable.value.includes(toInsertTemplate(insert)) ||
      Array.from(referencesByName).some(
        ([name, references]) =>
          references && variable.value.includes(`{{${name}}}`),
      )
    referencesByName.set(variable.name, referencesInsert)
  }

  return Array.from(referencesByName).some(
    ([name, references]) => references && value.includes(`{{${name}}}`),
  )
}

/**
 * Checks whether a template contains a `{{name}}` placeholder for the given
 * user variable. Used by the editor to warn before a rename or a removal
 * leaves those references unresolved.
 */
export function templateReferencesVariable(
  value: string,
  name: string,
): boolean {
  if (!name) return false
  return value.includes(`{{${name}}}`)
}

/**
 * Resolves the template placeholders of a Page Action input step value.
 */
export function resolveActionVariables(
  params: ResolveActionVariablesParams,
): string {
  const {
    value,
    selectedText = "",
    srcUrl = "",
    clipboardText = "",
    userVariables,
  } = params

  const variables = resolveUserVariables(
    buildBuiltinVariables({ selectedText, srcUrl, clipboardText }),
    userVariables,
  )

  return safeInterpolate(value, variables)
}

export const paramToStr = (param: PageAction.Parameter): string => {
  switch (param.type) {
    case PAGE_ACTION_CONTROL.start:
    case PAGE_ACTION_CONTROL.end:
    case PAGE_ACTION_CONTROL.navigate:
    case PAGE_ACTION_EVENT.click:
    case PAGE_ACTION_EVENT.doubleClick:
    case PAGE_ACTION_EVENT.tripleClick:
      return param.label
    case PAGE_ACTION_EVENT.input:
      return param.value
    case PAGE_ACTION_EVENT.filePaste:
      return param.value
    case PAGE_ACTION_EVENT.keyboard:
      return getKeyLabel(param)
    case PAGE_ACTION_EVENT.scroll:
      return `x: ${param.x}, y: ${param.y}`
  }
}
