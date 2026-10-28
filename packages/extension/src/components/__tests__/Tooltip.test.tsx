import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { Tooltip } from "../Tooltip"
import { popupContext } from "@/hooks/usePopupContext"
import { SIDE, ALIGN } from "@/const"

// Renders the tooltip in a popup context and hovers its anchor.
const renderTooltip = async (zoomCompensation?: number) => {
  const anchor = document.createElement("button")
  document.body.appendChild(anchor)
  render(
    <popupContext.Provider
      value={{ side: SIDE.top, align: ALIGN.start, zoomCompensation }}
    >
      <Tooltip text="Google" positionElm={anchor} delay={0} />
    </popupContext.Provider>,
  )
  fireEvent.mouseEnter(anchor)
  return screen.findByText("Google")
}

describe("Tooltip", () => {
  it("TT-01: 正常系: ズームを打ち消すときは文字サイズと余白を補正する", async () => {
    const text = await renderTooltip(1.25)
    expect(text.style.fontSize).toBe("15px")
    expect(text.parentElement?.style.padding).toBe("7.5px 10px")
    expect(text.parentElement?.style.minWidth).toBe("20px")
  })

  it("TT-02: 正常系: 補正なし（ズームに追従・ポップアップ外）ではクラスのサイズのまま", async () => {
    const text = await renderTooltip()
    expect(text.style.fontSize).toBe("")
    expect(text.parentElement?.style.padding).toBe("")
  })
})
