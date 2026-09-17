import { describe, it, expect, vi } from "vitest"
import { INSERT, InsertSymbol } from "@/services/pageAction"

vi.mock("@/services/i18n", () => ({
  t: (key: string) => key,
  getUILanguage: () => "en",
}))

vi.mock("@/services/pageAction/listener", () => ({
  getKeyLabel: vi.fn(),
}))

import {
  LocaleKey,
  convReadableKeysToSymbols,
  convSymbolsToReadableKeys,
  resolveActionVariables,
} from "./helper"

describe("pageAction helper conversion", () => {
  it("returns empty string for undefined or null inputs", () => {
    expect(convSymbolsToReadableKeys(undefined)).toBe("")
    expect(convSymbolsToReadableKeys(null)).toBe("")
    expect(convReadableKeysToSymbols(undefined)).toBe("")
    expect(convReadableKeysToSymbols(null)).toBe("")
  })

  it("converts symbols to readable keys", () => {
    const value = `A ${InsertSymbol[INSERT.SELECTED_TEXT]} B ${InsertSymbol[INSERT.URL]} C ${InsertSymbol[INSERT.PROMPT]}`
    expect(convSymbolsToReadableKeys(value)).toBe(
      `A ${LocaleKey}${INSERT.SELECTED_TEXT} B ${LocaleKey}${INSERT.URL} C ${LocaleKey}${INSERT.PROMPT}`,
    )
  })

  it("converts readable keys to symbols", () => {
    const value = `A ${LocaleKey}${INSERT.CLIPBOARD} B ${LocaleKey}${INSERT.LANG} C ${LocaleKey}${INSERT.PROMPT}`
    expect(convReadableKeysToSymbols(value)).toBe(
      `A ${InsertSymbol[INSERT.CLIPBOARD]} B ${InsertSymbol[INSERT.LANG]} C ${InsertSymbol[INSERT.PROMPT]}`,
    )
  })
})

describe("resolveActionVariables", () => {
  it("resolves basic variables in input value without prompt", () => {
    const result = resolveActionVariables({
      value: "Selected: {{SelectedText}}, URL: {{Url}}, Lang: {{Lang}}",
      selectedText: "Hello",
      srcUrl: "https://example.com",
    })
    expect(result).toBe("Selected: Hello, URL: https://example.com, Lang: en")
  })

  it("resolves {{Prompt}} to the configured prompt", () => {
    const result = resolveActionVariables({
      value: "{{Prompt}}",
      prompt: "Summarize the text",
    })
    expect(result).toBe("Summarize the text")
  })

  it("resolves nested variables inside the prompt template (Stage 1) then substitutes {{Prompt}} (Stage 2)", () => {
    const result = resolveActionVariables({
      value: "Prompt: {{Prompt}}\nOrigin: {{Url}}",
      prompt: "Summarize: {{SelectedText}} from {{Clipboard}}",
      selectedText: "Important article",
      clipboardText: "Extra context",
      srcUrl: "https://news.example.com",
    })
    expect(result).toBe(
      "Prompt: Summarize: Important article from Extra context\nOrigin: https://news.example.com",
    )
  })

  it("resolves userVariables in prompt and in value", () => {
    const result = resolveActionVariables({
      value: "{{Prompt}} and {{myVar}}",
      prompt: "Custom: {{myVar}} with {{SelectedText}}",
      selectedText: "Target",
      userVariables: [{ name: "myVar", value: "CustomVal" }],
    })
    expect(result).toBe("Custom: CustomVal with Target and CustomVal")
  })

  it("does not recursively evaluate literal placeholders inside selected text", () => {
    const prompt = "Explain this text:\n\n{{SelectedText}}"
    const selectedText = "The literal text {{Prompt}} must remain unchanged."

    const result = resolveActionVariables({
      value: "{{Prompt}}",
      prompt,
      selectedText,
    })

    expect(result).toBe(
      "Explain this text:\n\nThe literal text {{Prompt}} must remain unchanged.",
    )
  })

  it("does not recursively evaluate nested placeholder-like text in clipboard or variables", () => {
    const prompt = "Data: {{Clipboard}}"
    const clipboardText = "{{SelectedText}} and {{Prompt}}"

    const result = resolveActionVariables({
      value: "{{Prompt}}",
      prompt,
      clipboardText,
    })

    expect(result).toBe("Data: {{SelectedText}} and {{Prompt}}")
  })

  it("does not expand {{Prompt}} if literally written inside prompt template itself", () => {
    const prompt = "Template with literal {{Prompt}} and {{SelectedText}}"
    const result = resolveActionVariables({
      value: "Result: {{Prompt}}",
      prompt,
      selectedText: "Sample",
    })

    expect(result).toBe("Result: Template with literal {{Prompt}} and Sample")
  })

  it("safely resolves {{Prompt}} to empty string when prompt is undefined", () => {
    const result = resolveActionVariables({
      value: "Before [{{Prompt}}] After",
      prompt: undefined,
    })
    expect(result).toBe("Before [] After")
  })

  it("safely resolves {{Prompt}} to empty string when prompt is empty string", () => {
    const result = resolveActionVariables({
      value: "Before [{{Prompt}}] After",
      prompt: "",
    })
    expect(result).toBe("Before [] After")
  })

  it("preserves unresolved unknown placeholders", () => {
    const result = resolveActionVariables({
      value: "{{UnknownVariable}} and {{Prompt}}",
      prompt: "Ready",
    })
    expect(result).toBe("{{UnknownVariable}} and Ready")
  })
})
