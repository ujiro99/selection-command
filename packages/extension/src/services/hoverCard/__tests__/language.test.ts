import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { toTranslatorLanguage, detectLanguage } from "../language"

describe("toTranslatorLanguage", () => {
  it.each([
    ["ja", "ja"],
    ["en-US", "en"],
    ["pt_BR", "pt"],
    ["zh", "zh"],
    ["zh-CN", "zh"],
    ["zh-Hans", "zh"],
    ["zh-TW", "zh-Hant"],
    ["zh-HK", "zh-Hant"],
    ["zh-Hant", "zh-Hant"],
    ["zh_TW", "zh-Hant"],
  ])("HC-L-01: normalizes %s to %s", (tag, expected) => {
    expect(toTranslatorLanguage(tag)).toBe(expected)
  })
})

describe("detectLanguage", () => {
  const signal = new AbortController().signal

  const mockI18n = (result: chrome.i18n.LanguageDetectionResult) => {
    vi.spyOn(console, "info").mockImplementation(() => {})
    chrome.i18n.detectLanguage = vi.fn((_text, callback) =>
      callback(result),
    ) as unknown as typeof chrome.i18n.detectLanguage
  }

  beforeEach(() => {
    document.documentElement.lang = "en"
  })

  afterEach(() => {
    document.documentElement.lang = ""
    vi.restoreAllMocks()
  })

  it("HC-L-02: uses CLD when it reports a dominant language", async () => {
    // CLD reports isReliable: false even for a clear French sentence.
    mockI18n({
      isReliable: false,
      languages: [{ language: "fr", percentage: 100 }],
    })

    await expect(detectLanguage("Bonjour le monde", signal)).resolves.toEqual({
      language: "fr",
      source: "chrome.i18n",
    })
  })

  it("HC-L-03: falls back to the page language when CLD is unsure", async () => {
    mockI18n({
      isReliable: false,
      languages: [{ language: "no", percentage: 40 }],
    })

    await expect(detectLanguage("Bonjour", signal)).resolves.toEqual({
      language: "en",
      source: "pageLang",
    })
  })

  it("HC-L-04: uses CLD's best guess when there is no page language", async () => {
    document.documentElement.lang = ""
    mockI18n({
      isReliable: false,
      languages: [{ language: "no", percentage: 40 }],
    })

    await expect(detectLanguage("Bonjour", signal)).resolves.toEqual({
      language: "no",
      source: "chrome.i18n",
    })
  })

  it("HC-L-05: returns null when nothing is detected", async () => {
    document.documentElement.lang = ""
    mockI18n({
      isReliable: false,
      languages: [{ language: "und", percentage: 100 }],
    })

    await expect(detectLanguage("1234", signal)).resolves.toBeNull()
  })
})
