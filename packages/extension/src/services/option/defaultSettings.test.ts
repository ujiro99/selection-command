import { describe, it, expect } from "vitest"
import { DefaultCommands, getDefaultCommands } from "./defaultSettings"
import { isLinkCommand } from "@/lib/utils"

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

  it("DS-03: should return Japanese commands for ja locale", () => {
    const commands = getDefaultCommands("ja")
    expect(commands).not.toEqual(DefaultCommands)
    const titles = commands.map((c) => c.title)
    expect(titles).toContain("Yahoo! Japan")
    // Should include Amazon.co.jp
    const amazonCmd = commands.find((c) => c.title === "Amazon")
    expect(amazonCmd).toBeDefined()
    expect((amazonCmd as any).searchUrl).toContain("amazon.co.jp")
    // Should include Japanese Gemini
    expect(titles.some((t) => t.includes("日本語"))).toBe(true)
  })

  it("DS-04: should return Chinese commands for zh locale", () => {
    const commands = getDefaultCommands("zh-CN")
    const titles = commands.map((c) => c.title)
    expect(titles).toContain("百度")
    expect(titles).toContain("哔哩哔哩")
  })

  it("DS-05: should return Korean commands for ko locale", () => {
    const commands = getDefaultCommands("ko")
    const titles = commands.map((c) => c.title)
    expect(titles).toContain("네이버")
    expect(titles).toContain("쿠팡")
  })

  it("DS-06: should return Russian commands for ru locale", () => {
    const commands = getDefaultCommands("ru")
    const titles = commands.map((c) => c.title)
    expect(titles).toContain("Яндекс")
    expect(titles).toContain("Ozon")
    expect(titles).toContain("Wildberries")
  })

  it("DS-07: should return German commands for de locale", () => {
    const commands = getDefaultCommands("de")
    const titles = commands.map((c) => c.title)
    expect(titles).toContain("eBay")
    const amazonCmd = commands.find((c) => c.title === "Amazon")
    expect((amazonCmd as any).searchUrl).toContain("amazon.de")
  })

  it("DS-08: should return French commands for fr locale", () => {
    const commands = getDefaultCommands("fr")
    const titles = commands.map((c) => c.title)
    expect(titles).toContain("leboncoin")
    const amazonCmd = commands.find((c) => c.title === "Amazon")
    expect((amazonCmd as any).searchUrl).toContain("amazon.fr")
  })

  it("DS-09: should return Spanish commands for es locale", () => {
    const commands = getDefaultCommands("es")
    const titles = commands.map((c) => c.title)
    expect(titles).toContain("MercadoLibre")
    const amazonCmd = commands.find((c) => c.title === "Amazon")
    expect((amazonCmd as any).searchUrl).toContain("amazon.es")
  })

  it("DS-10: should return Brazilian Portuguese commands for pt-BR locale", () => {
    const commands = getDefaultCommands("pt-BR")
    const titles = commands.map((c) => c.title)
    expect(titles).toContain("Mercado Livre")
    const amazonCmd = commands.find((c) => c.title === "Amazon")
    expect((amazonCmd as any).searchUrl).toContain("amazon.com.br")
  })

  it("DS-11: should return Portuguese commands for pt locale", () => {
    const commands = getDefaultCommands("pt")
    const titles = commands.map((c) => c.title)
    expect(titles).toContain("OLX")
  })

  it("DS-12: should return Hindi/India commands for hi locale", () => {
    const commands = getDefaultCommands("hi")
    const titles = commands.map((c) => c.title)
    expect(titles).toContain("Flipkart")
    const amazonCmd = commands.find((c) => c.title === "Amazon")
    expect((amazonCmd as any).searchUrl).toContain("amazon.in")
  })

  it("DS-13: should return Indonesian commands for id locale", () => {
    const commands = getDefaultCommands("id")
    const titles = commands.map((c) => c.title)
    expect(titles).toContain("Tokopedia")
    expect(titles).toContain("Shopee")
  })

  it("DS-14: should return Malay commands for ms locale", () => {
    const commands = getDefaultCommands("ms")
    const titles = commands.map((c) => c.title)
    expect(titles).toContain("Lazada")
    expect(titles).toContain("Shopee")
  })

  it("DS-15: should return Italian commands for it locale", () => {
    const commands = getDefaultCommands("it")
    const amazonCmd = commands.find((c) => c.title === "Amazon")
    expect((amazonCmd as any).searchUrl).toContain("amazon.it")
  })

  it("DS-16: all locale command sets should include a link preview command", () => {
    const locales = [
      "ja", "zh-CN", "ko", "ru", "de", "fr", "es",
      "pt-BR", "pt", "hi", "id", "ms", "it", "en",
    ]
    for (const locale of locales) {
      const commands = getDefaultCommands(locale)
      const linkCmd = commands.find(isLinkCommand)
      expect(linkCmd, `Missing link command for locale: ${locale}`).toBeDefined()
    }
  })

  it("DS-17: all locale command sets should include Google", () => {
    const locales = ["ja", "ko", "ru", "de", "fr", "es", "pt-BR", "pt", "hi", "id", "ms", "it", "en"]
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
    const locales = [
      "ja", "zh-CN", "ko", "ru", "de", "fr", "es",
      "pt-BR", "pt", "hi", "id", "ms", "it", "en",
    ]
    for (const locale of locales) {
      const commands = getDefaultCommands(locale)
      const ids = commands.map((c) => c.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size, `Duplicate IDs found for locale: ${locale}`).toBe(ids.length)
    }
  })

  it("DS-20: locale Gemini commands should use AI_PROMPT open mode", () => {
    const locales = ["ja", "zh-CN", "ko", "ru", "de", "fr", "es", "pt-BR", "hi", "id", "ms", "it"]
    for (const locale of locales) {
      const commands = getDefaultCommands(locale)
      const geminiCmds = commands.filter((c) => c.title.startsWith("Gemini"))
      expect(geminiCmds.length, `No Gemini command for locale: ${locale}`).toBeGreaterThan(0)
      for (const cmd of geminiCmds) {
        expect((cmd as any).openMode, `Gemini in ${locale} should use AI_PROMPT`).toBe("aiPrompt")
        expect((cmd as any).aiPromptOption).toBeDefined()
        expect((cmd as any).aiPromptOption.serviceId).toBe("gemini")
        expect((cmd as any).aiPromptOption.prompt).toContain("{{SelectedText}}")
        expect((cmd as any).pageActionOption).toBeUndefined()
      }
    }
  })
})
