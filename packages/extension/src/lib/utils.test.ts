import { describe, it, expect } from "vitest"
import { parseGeminiUrl, toUrl, matchesPageActionUrl } from "./utils"
import { SPACE_ENCODING } from "@/const"
import type { UrlParam } from "@/types"

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

describe("toUrl", () => {
  it("TU-01: returns the string as-is when input is a string", () => {
    const input = "https://example.com/search?q=test"
    expect(toUrl(input)).toBe(input)
  })

  it("TU-02: converts UrlParam with PLUS space encoding (default)", () => {
    const param: UrlParam = {
      searchUrl: "https://example.com/search?q=%s",
      selectionText: "hello world",
    }
    expect(toUrl(param)).toBe("https://example.com/search?q=hello+world")
  })

  it("TU-03: converts UrlParam with PERCENT space encoding", () => {
    const param: UrlParam = {
      searchUrl: "https://example.com/search?q=%s",
      selectionText: "hello world",
      spaceEncoding: SPACE_ENCODING.PERCENT,
    }
    expect(toUrl(param)).toBe("https://example.com/search?q=hello%20world")
  })

  it("TU-04: converts UrlParam with explicit PLUS space encoding", () => {
    const param: UrlParam = {
      searchUrl: "https://example.com/search?q=%s",
      selectionText: "hello world",
      spaceEncoding: SPACE_ENCODING.PLUS,
    }
    expect(toUrl(param)).toBe("https://example.com/search?q=hello+world")
  })

  it("TU-05: escapes forward slashes in text", () => {
    const param: UrlParam = {
      searchUrl: "https://example.com/search?q=%s",
      selectionText: "hello/world",
    }
    expect(toUrl(param)).toBe("https://example.com/search?q=hello%5C%2Fworld")
  })

  it("TU-06: uses clipboard text when useClipboard is true and selectionText is empty", () => {
    const param: UrlParam = {
      searchUrl: "https://example.com/search?q=%s",
      selectionText: "",
      useClipboard: true,
    }
    const clipboardText = "clipboard content"
    expect(toUrl(param, clipboardText)).toBe(
      "https://example.com/search?q=clipboard+content",
    )
  })

  it("TU-07: prefers selectionText over clipboard when both are present", () => {
    const param: UrlParam = {
      searchUrl: "https://example.com/search?q=%s",
      selectionText: "selection",
      useClipboard: true,
    }
    const clipboardText = "clipboard"
    expect(toUrl(param, clipboardText)).toBe(
      "https://example.com/search?q=selection",
    )
  })

  it("TU-08: uses empty string when useClipboard is true but clipboard is undefined", () => {
    const param: UrlParam = {
      searchUrl: "https://example.com/search?q=%s",
      selectionText: "",
      useClipboard: true,
    }
    expect(toUrl(param)).toBe("https://example.com/search?q=")
  })

  it("TU-09: URL encodes special characters", () => {
    const param: UrlParam = {
      searchUrl: "https://example.com/search?q=%s",
      selectionText: "hello@world#test",
    }
    expect(toUrl(param)).toBe(
      "https://example.com/search?q=hello%40world%23test",
    )
  })

  it("TU-10: handles empty selectionText", () => {
    const param: UrlParam = {
      searchUrl: "https://example.com/search?q=%s",
      selectionText: "",
    }
    expect(toUrl(param)).toBe("https://example.com/search?q=")
  })

  it("TU-11: handles text with multiple spaces", () => {
    const param: UrlParam = {
      searchUrl: "https://example.com/search?q=%s",
      selectionText: "hello   world   test",
    }
    expect(toUrl(param)).toBe(
      "https://example.com/search?q=hello+++world+++test",
    )
  })

  it("TU-12: handles Japanese text", () => {
    const param: UrlParam = {
      searchUrl: "https://example.com/search?q=%s",
      selectionText: "こんにちは 世界",
    }
    expect(toUrl(param)).toBe(
      "https://example.com/search?q=%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF+%E4%B8%96%E7%95%8C",
    )
  })

  it("TU-13: handles text with newlines and tabs", () => {
    const param: UrlParam = {
      searchUrl: "https://example.com/search?q=%s",
      selectionText: "hello\nworld\ttest",
    }
    expect(toUrl(param)).toBe(
      "https://example.com/search?q=hello%0Aworld%09test",
    )
  })
})

describe("matchesPageActionUrl", () => {
  it("MU-01: exact match without wildcard", () => {
    expect(
      matchesPageActionUrl(
        "https://example.com/page",
        "https://example.com/page",
      ),
    ).toBe(true)
  })

  it("MU-02: no match without wildcard - different domain", () => {
    expect(
      matchesPageActionUrl(
        "https://example.com/page",
        "https://other.com/page",
      ),
    ).toBe(false)
  })

  it("MU-03: no match without wildcard - different path", () => {
    expect(
      matchesPageActionUrl(
        "https://example.com/page",
        "https://example.com/other",
      ),
    ).toBe(false)
  })

  it("MU-04: wildcard matches any path suffix", () => {
    expect(
      matchesPageActionUrl(
        "https://example.com/*",
        "https://example.com/path?q=1",
      ),
    ).toBe(true)
  })

  it("MU-05: wildcard at end of path matches query string", () => {
    expect(
      matchesPageActionUrl(
        "https://example.com/search*",
        "https://example.com/search?q=foo",
      ),
    ).toBe(true)
  })

  it("MU-06: wildcard in hostname matches subdomain", () => {
    expect(
      matchesPageActionUrl(
        "https://*.example.com/page",
        "https://sub.example.com/page",
      ),
    ).toBe(true)
  })

  it("MU-07: wildcard does not match different domain", () => {
    expect(
      matchesPageActionUrl("https://example.com/*", "https://other.com/path"),
    ).toBe(false)
  })

  it("MU-08: wildcard matches empty suffix", () => {
    expect(
      matchesPageActionUrl(
        "https://example.com/path*",
        "https://example.com/path",
      ),
    ).toBe(true)
  })
})
