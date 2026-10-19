import { describe, it, expect } from "vitest"
import { findRemUsages } from "../findRemUsages"

describe("findRemUsages", () => {
  it("FRU-01: 正常系: rem を使う宣言を検出する", () => {
    // Arrange
    const css =
      ".a { padding: 1rem; margin: 4px; } .b { width: calc(100% - .5rem); }"

    // Act
    const usages = findRemUsages(css)

    // Assert
    expect(usages).toEqual([
      { selector: ".a", prop: "padding", value: "1rem" },
      { selector: ".b", prop: "width", value: "calc(100% - .5rem)" },
    ])
  })

  it("FRU-02: 正常系: カスタムプロパティや負の値の rem も検出する", () => {
    // Arrange
    const css = ":host { --text-base: 1rem; } .c { margin-top: -0.25rem; }"

    // Act
    const usages = findRemUsages(css)

    // Assert
    expect(usages.map((u) => u.prop)).toEqual(["--text-base", "margin-top"])
  })

  it("FRU-03: 正常系: メディアクエリの条件に含まれる rem は対象外とする", () => {
    // Arrange
    const css = "@media (width >= 40rem) { .d { padding: 8px; } }"

    // Act
    const usages = findRemUsages(css)

    // Assert
    expect(usages).toEqual([])
  })

  it("FRU-04: 境界値: rem を含む識別子やセレクタは誤検出しない", () => {
    // Arrange
    const css =
      '.rem-1 { animation-name: remove; font-family: "Lorem"; content: "2rems"; }'

    // Act
    const usages = findRemUsages(css)

    // Assert
    expect(usages).toEqual([])
  })

  it("FRU-05: 正常系: at-rule 直下の宣言は at-rule 名を selector とする", () => {
    // Arrange
    const css = "@page { margin: 2rem; }"

    // Act
    const usages = findRemUsages(css)

    // Assert
    expect(usages).toEqual([
      { selector: "@page ", prop: "margin", value: "2rem" },
    ])
  })
})
