import { describe, it, expect } from "vitest"
import { readdirSync, readFileSync } from "fs"
import { resolve } from "path"

const LOCALES_DIR = resolve(__dirname, "../../../public/_locales")

function getLocaleDirs(): string[] {
  return readdirSync(LOCALES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
}

function loadMessages(locale: string): Record<string, unknown> {
  const filePath = resolve(LOCALES_DIR, locale, "messages.json")
  const content = readFileSync(filePath, "utf-8")
  return JSON.parse(content)
}

describe("_locales messages.json", () => {
  const locales = getLocaleDirs()
  const referenceLocale = "en"
  const referenceMessages = loadMessages(referenceLocale)
  const referenceKeys = Object.keys(referenceMessages)

  it("LC-01: should have at least one locale directory", () => {
    expect(locales.length).toBeGreaterThan(0)
  })

  it("LC-02: all locales should contain messages.json with the same keys as en", () => {
    for (const locale of locales) {
      if (locale === referenceLocale) continue
      const messages = loadMessages(locale)
      const keys = Object.keys(messages)
      const missingKeys = referenceKeys.filter((k) => !keys.includes(k))
      const extraKeys = keys.filter((k) => !referenceKeys.includes(k))
      expect(
        missingKeys,
        `[${locale}] missing keys: ${missingKeys.join(", ")}`,
      ).toHaveLength(0)
      expect(
        extraKeys,
        `[${locale}] extra keys: ${extraKeys.join(", ")}`,
      ).toHaveLength(0)
    }
  })

  it("LC-03: all locales should have keys in the same order as en", () => {
    for (const locale of locales) {
      if (locale === referenceLocale) continue
      const messages = loadMessages(locale)
      const keys = Object.keys(messages)
      expect(keys, `[${locale}] key order differs from en`).toEqual(
        referenceKeys,
      )
    }
  })

  it("LC-04: onboarding_step1TargetWord should be part of onboarding_step1TargetText in every locale", () => {
    // Otherwise the onboarding card silently falls back to the drag hint
    // in that locale (see splitTargetWord), changing the experiment's arm.
    type Message = { message: string }
    for (const locale of locales) {
      const messages = loadMessages(locale)
      const text = (messages.onboarding_step1TargetText as Message).message
      const word = (messages.onboarding_step1TargetWord as Message).message
      expect(word, `[${locale}] empty target word`).not.toBe("")
      expect(text, `[${locale}] target word not in target text`).toContain(word)
    }
  })
})
