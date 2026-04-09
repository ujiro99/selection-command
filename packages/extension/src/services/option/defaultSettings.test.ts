import { describe, it, expect } from "vitest"
import { DefaultCommands, getDefaultCommands } from "./defaultSettings"
import { isLinkCommand } from "@/lib/utils"
import { INSERT, toInsertTemplate } from "@/services/pageAction"
import { getAiServicesFallback } from "@/services/aiPrompt"

const SYM_SELECTED_TEXT = toInsertTemplate(INSERT.SELECTED_TEXT)
const SYM_URL = toInsertTemplate(INSERT.URL)

const ALL_LOCALES = [
  "ja",
  "zh-CN",
  "ko",
  "ru",
  "de",
  "fr",
  "es",
  "pt-BR",
  "pt",
  "hi",
  "id",
  "ms",
  "it",
  "en",
]

describe("getDefaultCommands", () => {
  it("DS-01: should return DefaultCommands for English locale", () => {
    expect(getDefaultCommands("en")).toEqual(DefaultCommands)
    expect(getDefaultCommands("en-US")).toEqual(DefaultCommands)
    expect(getDefaultCommands("en-GB")).toEqual(DefaultCommands)
  })

  it("DS-02: should return DefaultCommands for unknown locale", () => {
    expect(getDefaultCommands("")).toEqual(DefaultCommands)
    expect(getDefaultCommands(undefined)).toEqual(DefaultCommands)
    expect(getDefaultCommands("xx")).toEqual(DefaultCommands)
  })

  const localeExpectations: Array<{
    id: string
    locale: string
    expectedTitles: string[]
    amazonDomain?: string
    geminiTitlePart?: string
  }> = [
    {
      id: "DS-03",
      locale: "ja",
      expectedTitles: ["Yahoo! Japan"],
      amazonDomain: "amazon.co.jp",
      geminiTitlePart: "日本語",
    },
    { id: "DS-04", locale: "zh-CN", expectedTitles: ["百度", "哔哩哔哩"] },
    { id: "DS-05", locale: "ko", expectedTitles: ["네이버", "쿠팡"] },
    {
      id: "DS-06",
      locale: "ru",
      expectedTitles: ["Яндекс", "Ozon", "Wildberries"],
    },
    {
      id: "DS-07",
      locale: "de",
      expectedTitles: ["eBay"],
      amazonDomain: "amazon.de",
    },
    {
      id: "DS-08",
      locale: "fr",
      expectedTitles: ["leboncoin"],
      amazonDomain: "amazon.fr",
    },
    {
      id: "DS-09",
      locale: "es",
      expectedTitles: ["eBay", "El Corte Inglés", "AliExpress"],
      amazonDomain: "amazon.es",
    },
    {
      id: "DS-10",
      locale: "pt-BR",
      expectedTitles: ["Mercado Livre"],
      amazonDomain: "amazon.com.br",
    },
    { id: "DS-11", locale: "pt", expectedTitles: ["OLX"] },
    {
      id: "DS-12",
      locale: "hi",
      expectedTitles: ["Flipkart"],
      amazonDomain: "amazon.in",
    },
    { id: "DS-13", locale: "id", expectedTitles: ["Tokopedia", "Shopee"] },
    { id: "DS-14", locale: "ms", expectedTitles: ["Lazada", "Shopee"] },
    {
      id: "DS-15",
      locale: "it",
      expectedTitles: [],
      amazonDomain: "amazon.it",
    },
  ]

  it.each(localeExpectations)(
    "$id: $locale locale should include expected commands",
    ({ locale, expectedTitles, amazonDomain, geminiTitlePart }) => {
      const commands = getDefaultCommands(locale)
      expect(commands).not.toEqual(DefaultCommands)
      const titles = commands.map((c) => c.title)

      for (const title of expectedTitles) {
        expect(titles).toContain(title)
      }

      if (amazonDomain) {
        const amazonCmd = commands.find((c) => c.title === "Amazon")
        expect(amazonCmd).toBeDefined()
        expect((amazonCmd as any).searchUrl).toContain(amazonDomain)
      }

      if (geminiTitlePart) {
        expect(titles.some((t) => t.includes(geminiTitlePart))).toBe(true)
      }
    },
  )

  it("DS-16: all locale command sets should include a link preview command", () => {
    for (const locale of ALL_LOCALES) {
      const commands = getDefaultCommands(locale)
      const linkCmd = commands.find(isLinkCommand)
      expect(
        linkCmd,
        `Missing link command for locale: ${locale}`,
      ).toBeDefined()
    }
  })

  it("DS-17: all locale command sets should include Google", () => {
    const locales = ALL_LOCALES.filter((l) => l !== "zh-CN")
    for (const locale of locales) {
      const commands = getDefaultCommands(locale)
      const googleCmd = commands.find((c) => c.title === "Google")
      expect(googleCmd, `Missing Google for locale: ${locale}`).toBeDefined()
    }
  })

  it("DS-18: should handle locale with underscore separator (e.g. zh_CN)", () => {
    const commands = getDefaultCommands("zh_CN")
    const titles = commands.map((c) => c.title)
    expect(titles).toContain("百度")
  })

  it("DS-19: all command IDs should be unique within each locale set", () => {
    for (const locale of ALL_LOCALES) {
      const commands = getDefaultCommands(locale)
      const ids = commands.map((c) => c.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size, `Duplicate IDs found for locale: ${locale}`).toBe(
        ids.length,
      )
    }
  })

  it("DS-20: locale Gemini commands should use AI_PROMPT open mode", () => {
    const locales = ALL_LOCALES.filter((l) => l !== "en" && l !== "pt")
    for (const locale of locales) {
      const commands = getDefaultCommands(locale)
      const geminiCmds = commands.filter((c) => c.title.startsWith("Gemini"))
      expect(
        geminiCmds.length,
        `No Gemini command for locale: ${locale}`,
      ).toBeGreaterThan(0)
      for (const cmd of geminiCmds) {
        expect(
          (cmd as any).openMode,
          `Gemini in ${locale} should use AI_PROMPT`,
        ).toBe("aiPrompt")
        expect((cmd as any).aiPromptOption).toBeDefined()
        expect((cmd as any).aiPromptOption.serviceId).toBe("gemini")
        expect((cmd as any).aiPromptOption.prompt).toContain(SYM_SELECTED_TEXT)
        expect((cmd as any).pageActionOption).toBeUndefined()
      }
    }
  })

  it("DS-21: all locale command sets should include page summary, YouTube summary and translation AI prompt commands", () => {
    for (const locale of ALL_LOCALES) {
      const commands = getDefaultCommands(locale)
      const aiPromptCmds = commands.filter(
        (c) => (c as any).openMode === "aiPrompt",
      )
      // Each locale should have at least 4 AI prompt commands
      // (explanation + page summary + YouTube summary + translation)
      expect(
        aiPromptCmds.length,
        `Locale ${locale} should have at least 4 AI prompt commands`,
      ).toBeGreaterThanOrEqual(4)
      // Page summary: uses {{Url}} in prompt
      const pageSummaryCmd = aiPromptCmds.find(
        (c) =>
          (c as any).aiPromptOption.prompt.includes(SYM_URL) &&
          !(c as any).aiPromptOption.prompt.toLowerCase().includes("youtube"),
      )
      expect(
        pageSummaryCmd,
        `Missing page summary command for locale: ${locale}`,
      ).toBeDefined()
      // YouTube summary: uses {{Url}} and mentions YouTube in prompt
      const youtubeSummaryCmd = aiPromptCmds.find(
        (c) =>
          (c as any).aiPromptOption.prompt.includes(SYM_URL) &&
          (c as any).aiPromptOption.prompt.toLowerCase().includes("youtube"),
      )
      expect(
        youtubeSummaryCmd,
        `Missing YouTube summary command for locale: ${locale}`,
      ).toBeDefined()
      // Translation: uses {{SelectedText}} in prompt, and refers to translation
      const translationCmd = aiPromptCmds.find(
        (c) =>
          (c as any).aiPromptOption.prompt.includes(SYM_SELECTED_TEXT) &&
          (c as any).aiPromptOption.prompt.match(
            /translat|翻[訳译]|互译|번역|перевод|переве|übersetz|tradu|terjemah|अनुवाद/i,
          ),
      )
      expect(
        translationCmd,
        `Missing translation command for locale: ${locale}`,
      ).toBeDefined()
    }
  })

  it("DS-23: all AI_PROMPT commands with serviceId 'gemini' should use the current Gemini icon URL", () => {
    const geminiService = getAiServicesFallback().find((s) => s.id === "gemini")
    expect(geminiService, "Gemini service must exist in ai-services.json").toBeDefined()
    const expectedIconUrl = geminiService!.faviconUrl
    for (const locale of ALL_LOCALES) {
      const commands = getDefaultCommands(locale)
      const geminiAiCmds = commands.filter(
        (c) =>
          (c as any).openMode === "aiPrompt" &&
          (c as any).aiPromptOption?.serviceId === "gemini",
      )
      for (const cmd of geminiAiCmds) {
        expect(
          (cmd as any).iconUrl,
          `Gemini AI prompt command "${(cmd as any).title}" in locale "${locale}" should use the current Gemini icon URL`,
        ).toBe(expectedIconUrl)
      }
    }
  })

  it("DS-22: page summary and YouTube summary commands should use {{Url}} not {{SelectedText}}", () => {
    for (const locale of ALL_LOCALES) {
      const commands = getDefaultCommands(locale)
      const aiPromptCmds = commands.filter(
        (c) => (c as any).openMode === "aiPrompt",
      )
      const urlBasedCmds = aiPromptCmds.filter((c) =>
        (c as any).aiPromptOption.prompt.includes(SYM_URL),
      )
      expect(
        urlBasedCmds.length,
        `Locale ${locale} should have at least 2 URL-based AI prompt commands`,
      ).toBeGreaterThanOrEqual(2)
      for (const cmd of urlBasedCmds) {
        expect(
          (cmd as any).aiPromptOption.prompt,
          `URL-based AI prompt in ${locale} should not contain {{SelectedText}}`,
        ).not.toContain(SYM_SELECTED_TEXT)
      }
    }
  })
})
