import { describe, it, expect } from "vitest"
import { STARTUP_METHOD, STYLE_VARIABLE } from "@/const"
import {
  POPUP_SPEED,
  detectPopupSpeed,
  getEffectivePopupSpeedValues,
  getPresetValues,
  isPopupDelayIgnored,
  toPopupSpeedValues,
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
  it("PS-03: 正常系: プリセット値を返す", () => {
    expect(getPresetValues(POPUP_SPEED.STANDARD)).toEqual({
      popupDelay: 250,
      popupDuration: 150,
    })
    expect(getPresetValues(POPUP_SPEED.FAST)).toEqual({
      popupDelay: 100,
      popupDuration: 80,
    })
    expect(getPresetValues(POPUP_SPEED.INSTANT)).toEqual({
      popupDelay: 0,
      popupDuration: 0,
    })
  })
})

describe("getEffectivePopupSpeedValues", () => {
  it("PS-04: 正常系: キーボード・長押し起動では delay を 0 にする", () => {
    const values = { popupDelay: 500, popupDuration: 300 }
    expect(
      getEffectivePopupSpeedValues(values, STARTUP_METHOD.KEYBOARD),
    ).toEqual({ popupDelay: 0, popupDuration: 300 })
    expect(
      getEffectivePopupSpeedValues(values, STARTUP_METHOD.LEFT_CLICK_HOLD),
    ).toEqual({ popupDelay: 0, popupDuration: 300 })
    // The given values are not modified.
    expect(values).toEqual({ popupDelay: 500, popupDuration: 300 })
  })

  it("PS-07: 正常系: delay が有効な起動方法では値をそのまま返す", () => {
    expect(
      getEffectivePopupSpeedValues(
        { popupDelay: 500, popupDuration: 300 },
        STARTUP_METHOD.TEXT_SELECTION,
      ),
    ).toEqual({ popupDelay: 500, popupDuration: 300 })
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
    expect(
      detectPopupSpeed(
        { popupDelay: 0, popupDuration: 120 },
        STARTUP_METHOD.KEYBOARD,
      ),
    ).toBeNull()
  })

  it("PS-08: 正常系: delay が無視される起動方法では duration だけで判定する", () => {
    expect(
      detectPopupSpeed(
        { popupDelay: 250, popupDuration: 150 },
        STARTUP_METHOD.KEYBOARD,
      ),
    ).toBe(POPUP_SPEED.STANDARD)
    expect(
      detectPopupSpeed(
        { popupDelay: 500, popupDuration: 80 },
        STARTUP_METHOD.LEFT_CLICK_HOLD,
      ),
    ).toBe(POPUP_SPEED.FAST)
  })
})

describe("toPopupSpeedValues", () => {
  it("PS-10: 正常系: userStyles から delay / duration を数値で読み取る", () => {
    expect(
      toPopupSpeedValues([
        { name: STYLE_VARIABLE.POPUP_DELAY, value: "120" },
        { name: STYLE_VARIABLE.POPUP_DURATION, value: 90 as unknown as string },
      ]),
    ).toEqual({ popupDelay: 120, popupDuration: 90 })
  })

  it("PS-11: 境界値: 未設定の場合は既定値を返す", () => {
    expect(toPopupSpeedValues(undefined)).toEqual({
      popupDelay: 250,
      popupDuration: 150,
    })
  })
})
