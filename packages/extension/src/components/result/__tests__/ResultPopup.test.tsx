import { describe, it, expect, vi } from "vitest"
import { createRef } from "react"
import { render, screen } from "@testing-library/react"
import { ResultPopup } from "../ResultPopup"
import { zoomCompensationContext } from "@/hooks/usePageZoom"

vi.mock("@/hooks/useSettings", () => ({
  useUserSettings: () => ({ userSettings: {} }),
}))

// Renders a visible result popup and returns its popover content element.
const renderResult = (zoomCompensation?: number) => {
  const positionRef = createRef<Element>() as { current: Element | null }
  positionRef.current = document.body
  const popup = (
    <ResultPopup
      visible
      positionRef={positionRef as React.RefObject<Element>}
      onClose={() => {}}
    >
      <span>result</span>
    </ResultPopup>
  )
  render(
    zoomCompensation == null ? (
      popup
    ) : (
      <zoomCompensationContext.Provider value={zoomCompensation}>
        {popup}
      </zoomCompensationContext.Provider>
    ),
  )
  return screen.getByText("result").closest("[data-state]") as HTMLElement
}

describe("ResultPopup", () => {
  it("RP-01: 正常系: ズームを打ち消すときは補正値を CSS 変数に設定する", () => {
    const content = renderResult(1.25)
    expect(content.style.getPropertyValue("--sc-zoom-compensation")).toBe(
      "1.25",
    )
  })

  it("RP-02: 正常系: メニューの外では補正値は 1 になる", () => {
    const content = renderResult()
    expect(content.style.getPropertyValue("--sc-zoom-compensation")).toBe("1")
  })
})
