import { describe, it, expect } from "vitest"
import { adjustWindowPosition } from "@/services/chrome"
import { POPUP_OFFSET } from "@/const"
import type { ScreenSize } from "@/services/screen"

// Secondary display located to the right of a 1920px primary display
const secondary: ScreenSize = {
  left: 1920,
  top: 0,
  width: 2560,
  height: 1440,
}

describe("adjustWindowPosition", () => {
  it("AWP-01: 画面内に収まる場合、位置を変更しない", () => {
    const result = adjustWindowPosition(100, 2000, 600, 700, secondary)

    expect(result).toEqual({ top: 100, left: 2000 })
  })

  it("AWP-02: 右下にはみ出す場合、ディスプレイ中央に補正する", () => {
    // Top-left is at the window's center, so the popup overflows the display
    const result = adjustWindowPosition(1000, 4000, 600, 700, secondary)

    expect(result).toEqual({
      top: Math.floor((1440 - 700) / 2),
      left: Math.floor((2560 - 600) / 2) + 1920,
    })
  })

  it("AWP-03: ディスプレイより大きいポップアップでも、ディスプレイ内を基準に中央配置する", () => {
    const result = adjustWindowPosition(500, 3000, 3000, 2000, secondary)

    expect(result).toEqual({
      top: Math.floor((1440 - 2000) / 2),
      left: Math.floor((2560 - 3000) / 2) + 1920,
    })
  })

  it("AWP-04: offset 指定時は POPUP_OFFSET 分ずらす", () => {
    const result = adjustWindowPosition(100, 2000, 600, 700, secondary, 2)

    expect(result).toEqual({
      top: 100 + POPUP_OFFSET * 2,
      left: 2000 + POPUP_OFFSET * 2,
    })
  })
})
