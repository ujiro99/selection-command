import { describe, it, expect } from "vitest"
import { parseGeminiUrl } from "./utils"

describe("parseGeminiMarkdownUrl", () => {
  it("PMU-01: extracts URL from markdown link format", () => {
    const input =
      "[https://mail.google.com/mail/u/0/#search/%s](https://www.google.com/search?q=https://mail.google.com/mail/u/0/%23search/%25s)"
    const expected = "https://mail.google.com/mail/u/0/#search/%s"

    expect(parseGeminiUrl(input)).toBe(expected)
  })

  it("PMU-02: returns original text when not markdown format", () => {
    const input = "https://google.com/search?q=%s"

    expect(parseGeminiUrl(input)).toBe(input)
  })

  it("PMU-03: returns original text for malformed markdown", () => {
    const input = "[incomplete markdown"

    expect(parseGeminiUrl(input)).toBe(input)
  })

  it("PMU-04: returns original text for incomplete URL (no protocol)", () => {
    const input = "[text](incomplete)"

    expect(parseGeminiUrl(input)).toBe(input)
  })

  it("PMU-05: handles empty text", () => {
    const input = ""

    expect(parseGeminiUrl(input)).toBe("")
  })

  it("PMU-06: handles complex URLs with encoded characters", () => {
    const input =
      "[https://example.com/search?q=%s&lang=en&type=web](https://www.google.com/search?q=https%3A%2F%2Fexample.com%2Fsearch%3Fq%3D%25s%26lang%3Den%26type%3Dweb)"
    const expected = "https://example.com/search?q=%s&lang=en&type=web"

    expect(parseGeminiUrl(input)).toBe(expected)
  })

  it("PMU-07: handles text with only brackets", () => {
    const input = "[text only]"

    expect(parseGeminiUrl(input)).toBe(input)
  })

  it("PMU-08: gmail test", () => {
    const input =
      "[https://mail.google.com/mail/u/0/\\#search/%s](https://www.google.com/search?q=https://mail.google.com/mail/u/0/%23search/%25s)"
    const expected = "https://mail.google.com/mail/u/0/#search/%s"

    expect(parseGeminiUrl(input)).toBe(expected)
  })
})
