import { describe, it, expect } from "vitest"
import { STYLE_VARIABLE } from "@/const"
import { usesIconColor, getDefaultValue } from "../userStyles"

describe("usesIconColor", () => {
  const iconColor = { name: STYLE_VARIABLE.ICON_COLOR, value: "#123456" }
  const bgColor = { name: STYLE_VARIABLE.BACKGROUND_COLOR, value: "#123456" }

  it("US-04: 正常系: ダークテーマで色の設定がなければ true を返す", () => {
    expect(usesIconColor(undefined, true)).toBe(true)
    expect(usesIconColor([], true)).toBe(true)
  })

  it("US-05: 正常系: ダークテーマではアイコン色以外の色が設定されていても true を返す", () => {
    expect(usesIconColor([bgColor], true)).toBe(true)
  })

  it("US-06: 正常系: アイコン色が設定されていればテーマに関係なく true を返す", () => {
    expect(usesIconColor([iconColor], false)).toBe(true)
    expect(usesIconColor([iconColor, bgColor], true)).toBe(true)
  })

  it("US-07: 正常系: ライトテーマでアイコン色の設定がなければ false を返す", () => {
    expect(usesIconColor(undefined, false)).toBe(false)
    expect(usesIconColor([bgColor], false)).toBe(false)
  })
})

describe("getDefaultValue", () => {
  it("US-08: 正常系: ライトテーマでは通常の初期値を返す", () => {
    expect(getDefaultValue(STYLE_VARIABLE.BACKGROUND_COLOR, false)).toBe(
      "#FFFFFF",
    )
    expect(getDefaultValue(STYLE_VARIABLE.FONT_COLOR, false)).toBe("#0F172A")
  })

  it("US-09: 正常系: ダークテーマではダーク用の初期値を返す", () => {
    expect(getDefaultValue(STYLE_VARIABLE.BACKGROUND_COLOR, true)).toBe(
      "#23272F",
    )
    expect(getDefaultValue(STYLE_VARIABLE.BORDER_COLOR, true)).toBe("#3C4049")
    expect(getDefaultValue(STYLE_VARIABLE.FONT_COLOR, true)).toBe("#E2E8F0")
  })

  it("US-10: 正常系: ダーク用の初期値がない変数はテーマに関係なく同じ値を返す", () => {
    expect(getDefaultValue(STYLE_VARIABLE.FONT_SCALE, true)).toBe(1)
    expect(getDefaultValue(STYLE_VARIABLE.POPUP_DELAY, true)).toBe(250)
  })
})
