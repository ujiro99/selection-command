import { describe, it, expect } from "vitest"
import { extractUrlsFromText, toHttpUrl, toLinkUrl } from "../urlExtractor"

describe("extractUrlsFromText", () => {
  it.each([
    ["EU-01", "https://example.com", ["https://example.com/"]],
    [
      "EU-02",
      "http://example.com/path?q=1#top",
      ["http://example.com/path?q=1#top"],
    ],
    ["EU-03", "  https://example.com/a  \n", ["https://example.com/a"]],
    [
      "EU-04",
      "ｈｔｔｐｓ：／／ｅｘａｍｐｌｅ．ｃｏｍ／ａ",
      ["https://example.com/a"],
    ],
    ["EU-05", "(https://example.com/a)", ["https://example.com/a"]],
    ["EU-06", "「https://example.com/a」。", ["https://example.com/a"]],
    ["EU-07", "<https://example.com/a>", ["https://example.com/a"]],
    ["EU-08", '"https://example.com/a",', ["https://example.com/a"]],
    ["EU-09", "https://example.com/a.", ["https://example.com/a"]],
    [
      "EU-10",
      "https://en.wikipedia.org/wiki/Foo_(bar)",
      ["https://en.wikipedia.org/wiki/Foo_(bar)"],
    ],
    [
      "EU-11",
      "(https://en.wikipedia.org/wiki/Foo_(bar))",
      ["https://en.wikipedia.org/wiki/Foo_(bar)"],
    ],
    ["EU-12", "www.example.com", ["https://www.example.com/"]],
    ["EU-13", "example.com/path", ["https://example.com/path"]],
    ["EU-14", "example.com:8080/path", ["https://example.com:8080/path"]],
    ["EU-15", "HTTPS://EXAMPLE.COM", ["https://example.com/"]],
    ["EU-16", "http://localhost:3000/", ["http://localhost:3000/"]],
    // URLs in a sentence
    [
      "EU-17",
      "詳細はhttps://example.com/aを参照してください。",
      ["https://example.com/a"],
    ],
    [
      "EU-18",
      "See https://example.com/a for details.",
      ["https://example.com/a"],
    ],
    [
      "EU-19",
      "公式サイト：www.example.com（日本語）",
      ["https://www.example.com/"],
    ],
    ["EU-20", "リンク(https://example.com/a)です", ["https://example.com/a"]],
    // Duplicates are merged
    [
      "EU-21",
      "https://example.com/a and https://example.com/a",
      ["https://example.com/a"],
    ],
    // Multiple URLs
    [
      "EU-22",
      "https://example.com/a\nhttps://example.com/b",
      ["https://example.com/a", "https://example.com/b"],
    ],
    [
      "EU-23",
      "https://example.com/a www.example.org",
      ["https://example.com/a", "https://www.example.org/"],
    ],
    // A closing bracket without a matching opening one ends the URL
    [
      "EU-24",
      "- [a](https://example.com/a?x=1)- [b](https://example.com/b)",
      ["https://example.com/a?x=1", "https://example.com/b"],
    ],
    [
      "EU-25",
      "[a](https://example.com/a)[b](https://example.com/b)",
      ["https://example.com/a", "https://example.com/b"],
    ],
    [
      "EU-26",
      "(see https://en.wikipedia.org/wiki/Foo_(bar)-baz)",
      ["https://en.wikipedia.org/wiki/Foo_(bar)-baz"],
    ],
    ["EU-27", "[https://example.com/a]", ["https://example.com/a"]],
    // Markdown links on separate lines
    [
      "EU-28",
      [
        "- [サンプル一覧](https://example.com/sites/demo/Lists/Sample/AllItems.aspx?view=list)",
        "- [テスト資料](https://example.com/sites/demo/Lists/Docs?view=list)",
      ].join("\n"),
      [
        "https://example.com/sites/demo/Lists/Sample/AllItems.aspx?view=list",
        "https://example.com/sites/demo/Lists/Docs?view=list",
      ],
    ],
  ])("%s: extracts URLs from %s", (_, input, expected) => {
    expect(extractUrlsFromText(input)).toEqual(expected)
  })

  it.each([
    ["EU-30", undefined],
    ["EU-31", ""],
    ["EU-32", "hello world"],
    ["EU-33", "example.com"],
    ["EU-34", "index.html"],
    ["EU-35", "user@example.com"],
    ["EU-36", "user@example.com/path"],
    ["EU-37", "javascript:alert(1)"],
    ["EU-38", "file:///etc/passwd"],
    ["EU-39", "ftp://example.com/file"],
    ["EU-40", "https://"],
    ["EU-41", `https://example.com/ ${"a".repeat(100_001)}`],
  ])("%s: finds no URL in %s", (_, input) => {
    expect(extractUrlsFromText(input)).toEqual([])
  })
})

describe("toHttpUrl", () => {
  it("TH-01: normalizes a http(s) URL", () => {
    expect(toHttpUrl("https://EXAMPLE.com")).toBe("https://example.com/")
  })

  it.each([undefined, "", "mailto:a@example.com", "javascript:void(0)", "abc"])(
    "TH-02: returns null for %s",
    (input) => {
      expect(toHttpUrl(input)).toBeNull()
    },
  )
})

describe("toLinkUrl", () => {
  it("TL-01: normalizes a http(s) URL", () => {
    expect(toLinkUrl("https://EXAMPLE.com")).toBe("https://example.com/")
  })

  it("TL-02: accepts a data URL as it is", () => {
    const url = "data:text/plain;charset=utf-8,Download test"
    expect(toLinkUrl(url)).toBe(url)
  })

  it.each([undefined, "", "mailto:a@example.com", "javascript:void(0)", "abc"])(
    "TL-03: returns null for %s",
    (input) => {
      expect(toLinkUrl(input)).toBeNull()
    },
  )
})
