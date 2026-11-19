import { describe, it, expect } from "vitest"
import { STARTUP_METHOD } from "@/const"
import {
  POPUP_SPEED,
  detectPopupSpeed,
  getPresetValues,
  getValuesOnStartupMethodChange,
  isPopupDelayIgnored,
} from "../popupSpeed"

describe("isPopupDelayIgnored", () => {
  it("PS-01: 正常系: キーボード・長押し起動では true を返す", () => {
    expect(isPopupDelayIgnored(STARTUP_METHOD.KEYBOARD)).toBe(true)
    expect(isPopupDelayIgnored(STARTUP_METHOD.LEFT_CLICK_HOLD)).toBe(true)
  })

  it("PS-02: 正常系: テキスト選択起動では false を返す", () => {
    expect(isPopupDelayIgnored(STARTUP_METHOD.TEXT_SELECTION)).toBe(false)
    expect(isPopupDelayIgnored(undefined)).toBe(false)
  })
})

describe("getPresetValues", () => {
  it("PS-03: 正常系: テキスト選択起動ではプリセット値をそのまま返す", () => {
    const method = STARTUP_METHOD.TEXT_SELECTION
    expect(getPresetValues(POPUP_SPEED.STANDARD, method)).toEqual({
      popupDelay: 250,
      popupDuration: 150,
    })
    expect(getPresetValues(POPUP_SPEED.FAST, method)).toEqual({
      popupDelay: 100,
      popupDuration: 80,
    })
    expect(getPresetValues(POPUP_SPEED.INSTANT, method)).toEqual({
      popupDelay: 0,
      popupDuration: 0,
    })
  })

  it("PS-04: 正常系: キーボード起動では delay を 0 にする", () => {
    expect(
      getPresetValues(POPUP_SPEED.STANDARD, STARTUP_METHOD.KEYBOARD),
    ).toEqual({ popupDelay: 0, popupDuration: 150 })
  })
})

describe("detectPopupSpeed", () => {
  it("PS-05: 正常系: プリセットと一致する値ならそのプリセットを返す", () => {
    expect(
      detectPopupSpeed(
        { popupDelay: 100, popupDuration: 80 },
        STARTUP_METHOD.TEXT_SELECTION,
      ),
    ).toBe(POPUP_SPEED.FAST)
    expect(
      detectPopupSpeed(
        { popupDelay: 0, popupDuration: 80 },
        STARTUP_METHOD.LEFT_CLICK_HOLD,
      ),
    ).toBe(POPUP_SPEED.FAST)
  })

  it("PS-06: 異常系: どのプリセットとも一致しなければ null を返す", () => {
    expect(
      detectPopupSpeed(
        { popupDelay: 120, popupDuration: 80 },
        STARTUP_METHOD.TEXT_SELECTION,
      ),
    ).toBeNull()
    // The delay must be 0 for keyboard startup.
    expect(
      detectPopupSpeed(
        { popupDelay: 250, popupDuration: 150 },
        STARTUP_METHOD.KEYBOARD,
      ),
    ).toBeNull()
  })
})

describe("getValuesOnStartupMethodChange", () => {
  it("PS-07: 正常系: プリセット選択中は切替先の起動方法の同じプリセットを適用する", () => {
    expect(
      getValuesOnStartupMethodChange(
        { popupDelay: 100, popupDuration: 80 },
        STARTUP_METHOD.TEXT_SELECTION,
        STARTUP_METHOD.KEYBOARD,
      ),
    ).toEqual({ popupDelay: 0, popupDuration: 80 })
    expect(
      getValuesOnStartupMethodChange(
        { popupDelay: 0, popupDuration: 80 },
        STARTUP_METHOD.KEYBOARD,
        STARTUP_METHOD.TEXT_SELECTION,
      ),
    ).toEqual({ popupDelay: 100, popupDuration: 80 })
  })

  it("PS-08: 正常系: カスタム値では duration を維持し delay を既定値にする", () => {
    expect(
      getValuesOnStartupMethodChange(
        { popupDelay: 0, popupDuration: 300 },
        STARTUP_METHOD.KEYBOARD,
        STARTUP_METHOD.TEXT_SELECTION,
      ),
    ).toEqual({ popupDelay: 250, popupDuration: 300 })
    expect(
      getValuesOnStartupMethodChange(
        { popupDelay: 500, popupDuration: 300 },
        STARTUP_METHOD.TEXT_SELECTION,
        STARTUP_METHOD.LEFT_CLICK_HOLD,
      ),
    ).toEqual({ popupDelay: 0, popupDuration: 300 })
  })
})
