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
  templateReferencesInsert,
} from "./helper"

describe("pageAction helper conversion", () => {
  it("returns empty string for undefined or null inputs", () => {
    expect(convSymbolsToReadableKeys(undefined)).toBe("")
    expect(convSymbolsToReadableKeys(null)).toBe("")
    expect(convReadableKeysToSymbols(undefined)).toBe("")
    expect(convReadableKeysToSymbols(null)).toBe("")
  })

  it("converts symbols to readable keys", () => {
    const value = `A {{${InsertSymbol[INSERT.SELECTED_TEXT]}}} B {{${InsertSymbol[INSERT.URL]}}}`
    expect(convSymbolsToReadableKeys(value)).toBe(
      `A {{${LocaleKey}${INSERT.SELECTED_TEXT}}} B {{${LocaleKey}${INSERT.URL}}}`,
    )
  })

  it("converts readable keys to symbols", () => {
    const value = `A {{${LocaleKey}${INSERT.CLIPBOARD}}} B {{${LocaleKey}${INSERT.LANG}}}`
    expect(convReadableKeysToSymbols(value)).toBe(
      `A {{${InsertSymbol[INSERT.CLIPBOARD]}}} B {{${InsertSymbol[INSERT.LANG]}}}`,
    )
  })

  it("leaves a user variable placeholder untouched in both directions", () => {
    expect(convSymbolsToReadableKeys("A {{MyVar}}")).toBe("A {{MyVar}}")
    expect(convReadableKeysToSymbols("A {{MyVar}}")).toBe("A {{MyVar}}")
  })

  it("only converts whole placeholder names, not substrings", () => {
    // A user variable whose name merely contains a built-in symbol must survive
    // a round trip; substring replacement used to mangle these.
    for (const name of [
      "Language",
      "MyUrl",
      "ClipboardNote",
      "SelectedTextA",
    ]) {
      const value = `A {{${name}}} B`
      expect(convSymbolsToReadableKeys(value)).toBe(value)
      expect(convReadableKeysToSymbols(value)).toBe(value)
    }
  })

  it("leaves symbols outside of a placeholder untouched", () => {
    const prose = `Open the ${InsertSymbol[INSERT.URL]} then paste`
    expect(convSymbolsToReadableKeys(prose)).toBe(prose)
  })
})

describe("resolveActionVariables", () => {
  it("HL-01: resolves built-in variables in an input value", () => {
    const result = resolveActionVariables({
      value: "Selected: {{SelectedText}}, URL: {{Url}}, Lang: {{Lang}}",
      selectedText: "Hello",
      srcUrl: "https://example.com",
    })
    expect(result).toBe("Selected: Hello, URL: https://example.com, Lang: en")
  })

  it("HL-02: resolves a user variable referenced by the value", () => {
    const result = resolveActionVariables({
      value: "{{Prompt}}",
      userVariables: [{ name: "Prompt", value: "Summarize the text" }],
    })
    expect(result).toBe("Summarize the text")
  })

  it("HL-03: resolves built-ins inside a user variable before substituting it", () => {
    const result = resolveActionVariables({
      value: "Prompt: {{Prompt}}\nOrigin: {{Url}}",
      selectedText: "Important article",
      clipboardText: "Extra context",
      srcUrl: "https://news.example.com",
      userVariables: [
        {
          name: "Prompt",
          value: "Summarize: {{SelectedText}} from {{Clipboard}}",
        },
      ],
    })
    expect(result).toBe(
      "Prompt: Summarize: Important article from Extra context\nOrigin: https://news.example.com",
    )
  })

  it("HL-04: lets a later variable reference an earlier one", () => {
    const result = resolveActionVariables({
      value: "{{Full}}",
      selectedText: "Target",
      userVariables: [
        { name: "Topic", value: "about {{SelectedText}}" },
        { name: "Full", value: "Write {{Topic}} now" },
      ],
    })
    expect(result).toBe("Write about Target now")
  })

  it("HL-05: leaves a forward reference as a literal placeholder", () => {
    const result = resolveActionVariables({
      value: "{{First}} / {{Second}}",
      userVariables: [
        { name: "First", value: "uses {{Second}}" },
        { name: "Second", value: "resolved" },
      ],
    })
    expect(result).toBe("uses {{Second}} / resolved")
  })

  it("HL-06: leaves a self reference as a literal placeholder", () => {
    const result = resolveActionVariables({
      value: "{{Loop}}",
      userVariables: [{ name: "Loop", value: "a {{Loop}} b" }],
    })
    expect(result).toBe("a {{Loop}} b")
  })

  it("HL-07: does not re-evaluate placeholders coming from substituted text", () => {
    const result = resolveActionVariables({
      value: "{{Prompt}}",
      selectedText: "The literal text {{Prompt}} must remain unchanged.",
      userVariables: [
        { name: "Prompt", value: "Explain this text:\n\n{{SelectedText}}" },
      ],
    })
    expect(result).toBe(
      "Explain this text:\n\nThe literal text {{Prompt}} must remain unchanged.",
    )
  })

  it("HL-08: does not re-evaluate placeholder-like clipboard content", () => {
    const result = resolveActionVariables({
      value: "{{Prompt}}",
      clipboardText: "{{SelectedText}} and {{Prompt}}",
      userVariables: [{ name: "Prompt", value: "Data: {{Clipboard}}" }],
    })
    expect(result).toBe("Data: {{SelectedText}} and {{Prompt}}")
  })

  it("HL-09: a user variable shadows a built-in of the same name", () => {
    const result = resolveActionVariables({
      value: "{{Lang}}",
      userVariables: [{ name: "Lang", value: "overridden" }],
    })
    expect(result).toBe("overridden")
  })

  it("HL-10: preserves unresolved unknown placeholders", () => {
    const result = resolveActionVariables({
      value: "{{UnknownVariable}} and {{Prompt}}",
      userVariables: [{ name: "Prompt", value: "Ready" }],
    })
    expect(result).toBe("{{UnknownVariable}} and Ready")
  })

  it("HL-11: resolves to the value unchanged when no user variables are given", () => {
    expect(resolveActionVariables({ value: "plain text" })).toBe("plain text")
    expect(resolveActionVariables({ value: "plain", userVariables: [] })).toBe(
      "plain",
    )
  })
})

describe("templateReferencesInsert", () => {
  it("TR-01: detects a placeholder used directly in the value", () => {
    expect(
      templateReferencesInsert("a {{Clipboard}} b", INSERT.CLIPBOARD),
    ).toBe(true)
  })

  it("TR-02: returns false when the placeholder is absent", () => {
    expect(templateReferencesInsert("a {{Url}} b", INSERT.CLIPBOARD)).toBe(
      false,
    )
  })

  it("TR-03: follows a reference through a user variable", () => {
    expect(
      templateReferencesInsert("use {{Prompt}}", INSERT.CLIPBOARD, [
        { name: "Prompt", value: "data: {{Clipboard}}" },
      ]),
    ).toBe(true)
  })

  it("TR-04: follows a chain of user variables", () => {
    expect(
      templateReferencesInsert("{{Outer}}", INSERT.CLIPBOARD, [
        { name: "Inner", value: "{{Clipboard}}" },
        { name: "Outer", value: "wraps {{Inner}}" },
      ]),
    ).toBe(true)
  })

  it("TR-05: ignores a variable the value never references", () => {
    expect(
      templateReferencesInsert("{{Other}}", INSERT.CLIPBOARD, [
        { name: "Unused", value: "{{Clipboard}}" },
        { name: "Other", value: "plain" },
      ]),
    ).toBe(false)
  })

  it("TR-06: terminates on cyclic variable data", () => {
    expect(
      templateReferencesInsert("{{A}}", INSERT.CLIPBOARD, [
        { name: "A", value: "{{B}}" },
        { name: "B", value: "{{A}}" },
      ]),
    ).toBe(false)
  })

  it("TR-07: does not follow a forward reference", () => {
    expect(
      templateReferencesInsert("{{A}}", INSERT.CLIPBOARD, [
        { name: "A", value: "uses {{C}}" },
        { name: "C", value: "{{Clipboard}}" },
      ]),
    ).toBe(false)
  })
})
