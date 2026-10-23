import { describe, it, expect } from "vitest"
import { STYLE_VARIABLE } from "@/const"
import { hasUserColors } from "../userStyles"

describe("hasUserColors", () => {
  it("US-01: 正常系: 色のスタイルが1つでも設定されていれば true を返す", () => {
    for (const name of [
      STYLE_VARIABLE.BACKGROUND_COLOR,
      STYLE_VARIABLE.BORDER_COLOR,
      STYLE_VARIABLE.FONT_COLOR,
      STYLE_VARIABLE.ICON_COLOR,
    ]) {
      expect(hasUserColors([{ name, value: "#123456" }])).toBe(true)
    }
  })

  it("US-02: 正常系: 色以外のスタイルのみの場合は false を返す", () => {
    expect(
      hasUserColors([
        { name: STYLE_VARIABLE.FONT_SCALE, value: "1.1" },
        { name: STYLE_VARIABLE.POPUP_DELAY, value: "250" },
      ]),
    ).toBe(false)
  })

  it("US-03: 境界値: 未設定・空配列・空文字の値は false を返す", () => {
    expect(hasUserColors(undefined)).toBe(false)
    expect(hasUserColors([])).toBe(false)
    expect(
      hasUserColors([{ name: STYLE_VARIABLE.BACKGROUND_COLOR, value: "" }]),
    ).toBe(false)
  })
})
