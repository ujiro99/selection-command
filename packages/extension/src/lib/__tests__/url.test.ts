import { describe, it, expect } from "vitest"
import {
  parseGeminiUrl,
  toUrl,
  matchesPageActionUrl,
  needsClipboard,
  convertUrlsToMarkdown,
  findMatchingPageRule,
  isUrl,
  isUrlParam,
} from "../url"
import { SPACE_ENCODING } from "@/const"
import type { PageRule, UrlParam } from "@/types"

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

  it("TU-04-a: converts UrlParam with DASH space encoding", () => {
    const param: UrlParam = {
      searchUrl: "https://example.com/w/wholesale-%s.html",
      selectionText: "hello world",
      spaceEncoding: SPACE_ENCODING.DASH,
    }
    expect(toUrl(param)).toBe(
      "https://example.com/w/wholesale-hello-world.html",
    )
  })

  it("TU-04-b: converts UrlParam with UNDERSCORE space encoding", () => {
    const param: UrlParam = {
      searchUrl: "https://en.wikipedia.org/wiki/%s",
      selectionText: "hello world",
      spaceEncoding: SPACE_ENCODING.UNDERSCORE,
    }
    expect(toUrl(param)).toBe("https://en.wikipedia.org/wiki/hello_world")
  })

  it("TU-05: Encode slashes in the text using URL encoding.", () => {
    const param: UrlParam = {
      searchUrl: "https://example.com/search?q=%s",
      selectionText: "hello/world",
    }
    expect(toUrl(param)).toBe("https://example.com/search?q=hello%2Fworld")
  })

  it("TU-06: uses clipboard text when selectionFromClipboard is true", () => {
    const param: UrlParam = {
      searchUrl: "https://example.com/search?q=%s",
      selectionText: "",
      selectionFromClipboard: true,
    }
    const clipboardText = "clipboard content"
    expect(toUrl(param, clipboardText)).toBe(
      "https://example.com/search?q=clipboard+content",
    )
  })

  it("TU-07: uses selectionText when selectionFromClipboard is not set even if clipboard text is given", () => {
    const param: UrlParam = {
      searchUrl: "https://example.com/search?q=%s",
      selectionText: "selection",
    }
    const clipboardText = "clipboard"
    expect(toUrl(param, clipboardText)).toBe(
      "https://example.com/search?q=selection",
    )
  })

  it("TU-08: uses empty string when selectionFromClipboard is true but clipboard is undefined", () => {
    const param: UrlParam = {
      searchUrl: "https://example.com/search?q=%s",
      selectionText: "",
      selectionFromClipboard: true,
    }
    expect(toUrl(param)).toBe("https://example.com/search?q=")
  })

  it("TU-08-a: resolves {{Clipboard}} and {{SelectedText}} in a clipboard template", () => {
    const param: UrlParam = {
      searchUrl: "https://example.com/?prompt=%s",
      selectionText: "Explain: {{SelectedText}} / {{Clipboard}}",
      clipboardTemplate: {},
    }
    expect(toUrl(param, "clip")).toBe(
      "https://example.com/?prompt=Explain%3A+clip+%2F+clip",
    )
  })

  it("TU-08-b: leaves the other placeholders and text in a clipboard template as-is", () => {
    const param: UrlParam = {
      searchUrl: "https://example.com/?prompt=%s",
      selectionText: "{{Unknown}} {{Clipboard}}",
      clipboardTemplate: {},
    }
    expect(toUrl(param, "clip")).toBe(
      "https://example.com/?prompt=%7B%7BUnknown%7D%7D+clip",
    )
  })

  it("TU-08-c: resolves a clipboard template with empty text when clipboard is undefined", () => {
    const param: UrlParam = {
      searchUrl: "https://example.com/?prompt=%s",
      selectionText: "Explain: {{SelectedText}}",
      clipboardTemplate: {},
    }
    expect(toUrl(param)).toBe("https://example.com/?prompt=Explain%3A+")
  })

  it("TU-08-d: converts URLs in the resolved clipboard template to Markdown when urlToMarkdown is true", () => {
    const param: UrlParam = {
      searchUrl: "https://example.com/?q=%s",
      selectionText: "[https://a.com](https://a.com) {{Clipboard}}",
      spaceEncoding: SPACE_ENCODING.PERCENT,
      clipboardTemplate: { urlToMarkdown: true },
    }
    // Already-converted links in the template are not converted twice.
    expect(toUrl(param, "https://b.com")).toBe(
      "https://example.com/?q=" +
        encodeURIComponent(
          "[https://a.com](https://a.com) [https://b.com](https://b.com)",
        ),
    )
  })

  it("TU-08-e: does not check selectionText again when selectionFromClipboard is true", () => {
    // Whether to use the clipboard is decided by the caller only once.
    const param: UrlParam = {
      searchUrl: "https://example.com/search?q=%s",
      selectionText: "selection",
      selectionFromClipboard: true,
    }
    expect(toUrl(param, "clip")).toBe("https://example.com/search?q=clip")
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

  it("TU-14: replaces %pageUrl with the encoded pageUrl", () => {
    const param: UrlParam = {
      searchUrl: "https://example.com/share?url=%pageUrl",
      selectionText: "",
      pageUrl: "https://source.example.com/article",
    }
    expect(toUrl(param)).toBe(
      "https://example.com/share?url=https%3A%2F%2Fsource.example.com%2Farticle",
    )
  })

  it("TU-15: replaces both %s and %pageUrl in the same searchUrl", () => {
    const param: UrlParam = {
      searchUrl: "https://example.com/share?url=%pageUrl&text=%s",
      selectionText: "hello world",
      pageUrl: "https://source.example.com/article",
    }
    expect(toUrl(param)).toBe(
      "https://example.com/share?url=https%3A%2F%2Fsource.example.com%2Farticle&text=hello+world",
    )
  })

  it("TU-16: replaces %pageUrl with an empty string when pageUrl is not set", () => {
    const param: UrlParam = {
      searchUrl: "https://example.com/share?url=%pageUrl",
      selectionText: "",
    }
    expect(toUrl(param)).toBe("https://example.com/share?url=")
  })

  it("TU-17: URL encodes reserved characters in pageUrl", () => {
    const param: UrlParam = {
      searchUrl: "https://example.com/share?url=%pageUrl",
      selectionText: "",
      pageUrl: "https://source.example.com/search?q=a&b=1#section",
    }
    expect(toUrl(param)).toBe(
      "https://example.com/share?url=https%3A%2F%2Fsource.example.com%2Fsearch%3Fq%3Da%26b%3D1%23section",
    )
  })
})

describe("needsClipboard", () => {
  const base: UrlParam = {
    searchUrl: "https://example.com/search?q=%s",
    selectionText: "",
  }

  it("NC-01: returns false for a plain string url", () => {
    expect(needsClipboard("https://example.com")).toBe(false)
  })

  it("NC-02: returns false when no part of the url uses the clipboard", () => {
    expect(needsClipboard(base)).toBe(false)
  })

  it("NC-03: returns true when selectionFromClipboard is true", () => {
    expect(needsClipboard({ ...base, selectionFromClipboard: true })).toBe(true)
  })

  it("NC-04: returns true when clipboardForSteps is true", () => {
    expect(needsClipboard({ ...base, clipboardForSteps: true })).toBe(true)
  })

  it("NC-05: returns true when clipboardTemplate is set", () => {
    expect(needsClipboard({ ...base, clipboardTemplate: {} })).toBe(true)
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

describe("convertUrlsToMarkdown", () => {
  it("CU-01: should convert a bare URL to Markdown link format", () => {
    expect(convertUrlsToMarkdown("https://example.com")).toBe(
      "[https://example.com](https://example.com)",
    )
  })

  it("CU-02: should convert multiple bare URLs in text", () => {
    const result = convertUrlsToMarkdown(
      "Check https://example.com and https://other.com for details",
    )
    expect(result).toBe(
      "Check [https://example.com](https://example.com) and [https://other.com](https://other.com) for details",
    )
  })

  it("CU-03: should not double-convert URLs already in Markdown format", () => {
    const input = "[https://example.com](https://example.com)"
    expect(convertUrlsToMarkdown(input)).toBe(input)
  })

  it("CU-03b: should not convert Markdown links with non-URL text labels", () => {
    const input = "[Example Site](https://example.com)"
    expect(convertUrlsToMarkdown(input)).toBe(input)
  })

  it("CU-04: should handle text with no URLs unchanged", () => {
    expect(convertUrlsToMarkdown("hello world")).toBe("hello world")
  })

  it("CU-05: should convert http URLs as well as https", () => {
    expect(convertUrlsToMarkdown("http://example.com")).toBe(
      "[http://example.com](http://example.com)",
    )
  })

  it("CU-06: should strip trailing comma from URL", () => {
    const result = convertUrlsToMarkdown("Check https://example.com, please")
    expect(result).toBe(
      "Check [https://example.com](https://example.com), please",
    )
  })

  it("CU-07: should strip trailing period from URL", () => {
    const result = convertUrlsToMarkdown("See https://example.com.")
    expect(result).toBe("See [https://example.com](https://example.com).")
  })
})

describe("isUrl", () => {
  it.each(["https://example.com", "http://example.com/path"])(
    "IU-01: returns true for %s",
    (input) => {
      expect(isUrl(input)).toBe(true)
    },
  )

  it.each([
    undefined,
    "",
    "example.com",
    "ftp://example.com",
    " https://a.com",
  ])("IU-02: returns false for %s", (input) => {
    expect(isUrl(input)).toBe(false)
  })
})

describe("isUrlParam", () => {
  it("IUP-01: returns true for a UrlParam", () => {
    expect(
      isUrlParam({ searchUrl: "https://example.com/?q=%s", selectionText: "" }),
    ).toBe(true)
  })

  it("IUP-02: returns false for a string url", () => {
    expect(isUrlParam("https://example.com")).toBe(false)
  })

  it("IUP-03: returns false for an object without selectionText", () => {
    expect(
      isUrlParam({ searchUrl: "https://example.com" } as unknown as UrlParam),
    ).toBe(false)
  })
})

describe("findMatchingPageRule", () => {
  const rule = (urlPattern: string) => ({ urlPattern }) as PageRule

  it("FPR-01: returns the first rule whose pattern matches the url", () => {
    const rules = [
      rule("https://other\\.com"),
      rule("https://example\\.com/a"),
      rule("https://example\\.com"),
    ]
    expect(findMatchingPageRule(rules, "https://example.com/a/b")).toBe(
      rules[1],
    )
  })

  it("FPR-02: returns undefined when no rule matches", () => {
    expect(
      findMatchingPageRule(
        [rule("https://other\\.com")],
        "https://example.com",
      ),
    ).toBeUndefined()
  })

  it("FPR-03: ignores rules with an empty pattern", () => {
    const rules = [rule(""), rule("example")]
    expect(findMatchingPageRule(rules, "https://example.com")).toBe(rules[1])
  })

  it("FPR-04: ignores rules with an invalid regular expression", () => {
    const rules = [rule("("), rule("example")]
    expect(findMatchingPageRule(rules, "https://example.com")).toBe(rules[1])
  })
})
