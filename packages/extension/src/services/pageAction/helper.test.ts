import { describe, it, expect, vi } from "vitest"
import { INSERT, InsertSymbol } from "@/services/pageAction"

vi.mock("@/services/i18n", () => ({
  t: (key: string) => key,
}))

vi.mock("@/services/pageAction/listener", () => ({
  getKeyLabel: vi.fn(),
}))

import {
  LocaleKey,
  convReadableKeysToSymbols,
  convSymbolsToReadableKeys,
} from "./helper"

describe("pageAction helper conversion", () => {
  it("returns empty string for undefined or null inputs", () => {
    expect(convSymbolsToReadableKeys(undefined)).toBe("")
    expect(convSymbolsToReadableKeys(null)).toBe("")
    expect(convReadableKeysToSymbols(undefined)).toBe("")
    expect(convReadableKeysToSymbols(null)).toBe("")
  })

  it("converts symbols to readable keys", () => {
    const value = `A ${InsertSymbol[INSERT.SELECTED_TEXT]} B ${InsertSymbol[INSERT.URL]}`
    expect(convSymbolsToReadableKeys(value)).toBe(
      `A ${LocaleKey}${INSERT.SELECTED_TEXT} B ${LocaleKey}${INSERT.URL}`,
    )
  })

  it("converts readable keys to symbols", () => {
    const value = `A ${LocaleKey}${INSERT.CLIPBOARD} B ${LocaleKey}${INSERT.LANG}`
    expect(convReadableKeysToSymbols(value)).toBe(
      `A ${InsertSymbol[INSERT.CLIPBOARD]} B ${InsertSymbol[INSERT.LANG]}`,
    )
  })
})
