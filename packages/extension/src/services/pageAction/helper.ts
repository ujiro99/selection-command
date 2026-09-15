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

export function convReadableKeysToSymbols(value?: string | null): string {
  let normalizedValue = value ?? ""
  const symbols = {
    [t(LocaleKey + INSERT.SELECTED_TEXT)]: InsertSymbol[INSERT.SELECTED_TEXT],
    [t(LocaleKey + INSERT.URL)]: InsertSymbol[INSERT.URL],
    [t(LocaleKey + INSERT.CLIPBOARD)]: InsertSymbol[INSERT.CLIPBOARD],
    [t(LocaleKey + INSERT.LANG)]: InsertSymbol[INSERT.LANG],
    [t(LocaleKey + INSERT.PAGE_HTML)]: InsertSymbol[INSERT.PAGE_HTML],
    [t(LocaleKey + INSERT.SELECTION_HTML)]: InsertSymbol[INSERT.SELECTION_HTML],
    [t(LocaleKey + INSERT.PROMPT)]: InsertSymbol[INSERT.PROMPT],
  }
  Object.entries(symbols).forEach(([key, val]) => {
    normalizedValue = normalizedValue.replace(new RegExp(key, "g"), val)
  })
  return normalizedValue
}

export function convSymbolsToReadableKeys(value?: string | null): string {
  let normalizedValue = value ?? ""
  const symbols = {
    [InsertSymbol[INSERT.SELECTED_TEXT]]: t(LocaleKey + INSERT.SELECTED_TEXT),
    [InsertSymbol[INSERT.URL]]: t(LocaleKey + INSERT.URL),
    [InsertSymbol[INSERT.CLIPBOARD]]: t(LocaleKey + INSERT.CLIPBOARD),
    [InsertSymbol[INSERT.LANG]]: t(LocaleKey + INSERT.LANG),
    [InsertSymbol[INSERT.PAGE_HTML]]: t(LocaleKey + INSERT.PAGE_HTML),
    [InsertSymbol[INSERT.SELECTION_HTML]]: t(LocaleKey + INSERT.SELECTION_HTML),
    [InsertSymbol[INSERT.PROMPT]]: t(LocaleKey + INSERT.PROMPT),
  }
  Object.entries(symbols).forEach(([key, val]) => {
    normalizedValue = normalizedValue.replace(new RegExp(key, "g"), val)
  })
  return normalizedValue
}

export type ResolveActionVariablesParams = {
  value: string
  selectedText?: string
  srcUrl?: string
  clipboardText?: string
  userVariables?: Array<UserVariable>
  prompt?: string
}

/**
 * Two-stage, non-recursive variable resolution for Page Action inputs.
 * Stage 1: Resolves the saved prompt template using base variables.
 * Stage 2: Resolves the input step value using base variables and the resolved prompt ({{Prompt}}).
 * Literal placeholders in the substituted text are never re-evaluated.
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
    prompt,
  } = params

  // Stage 1: Build base variables map (intentionally excludes Prompt)
  const baseVariables: Record<string, string> = {
    [InsertSymbol[INSERT.SELECTED_TEXT]]: selectedText,
    [InsertSymbol[INSERT.URL]]: srcUrl,
    [InsertSymbol[INSERT.CLIPBOARD]]: clipboardText,
    [InsertSymbol[INSERT.LANG]]: getUILanguage(),
    ...(userVariables?.reduce(
      (acc, variable) => {
        acc[variable.name] = variable.value
        return acc
      },
      {} as Record<string, string>,
    ) || {}),
  }

  // Resolve prompt template with base variables if provided; safely handle missing/empty prompt
  const resolvedPrompt = prompt ? safeInterpolate(prompt, baseVariables) : ""

  // Stage 2: Combine base variables with the resolved prompt
  const stepVariables: Record<string, string> = {
    ...baseVariables,
    [InsertSymbol[INSERT.PROMPT]]: resolvedPrompt,
  }

  // Single-pass replacement over value prevents recursive evaluation of substituted text
  return safeInterpolate(value, stepVariables)
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
