import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { Tooltip } from "../Tooltip"
import { popupContext } from "@/hooks/usePopupContext"
import { zoomCompensationContext } from "@/hooks/usePageZoom"
import { SIDE, ALIGN } from "@/const"

// Renders the tooltip in a popup context and hovers its anchor.
// Without zoomCompensation it renders outside the selection menu.
const renderTooltip = async (zoomCompensation?: number) => {
  const anchor = document.createElement("button")
  document.body.appendChild(anchor)
  const tooltip = (
    <popupContext.Provider value={{ side: SIDE.top, align: ALIGN.start }}>
      <Tooltip text="Google" positionElm={anchor} delay={0} />
    </popupContext.Provider>
  )
  render(
    zoomCompensation == null ? (
      tooltip
    ) : (
      <zoomCompensationContext.Provider value={zoomCompensation}>
        {tooltip}
      </zoomCompensationContext.Provider>
    ),
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
