import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { useHoverGate, HOVER_BLOCKED_ATTR } from "../useHoverGate"

function Content() {
  const hoverGate = useHoverGate()
  return (
    <div data-testid="content" {...hoverGate}>
      <span data-testid="child" />
    </div>
  )
}

const setup = () => {
  render(<Content />)
  return {
    content: screen.getByTestId("content"),
    child: screen.getByTestId("child"),
  }
}

const isBlocked = (elm: HTMLElement) => elm.hasAttribute(HOVER_BLOCKED_ATTR)

describe("useHoverGate", () => {
  it("HG-01: 正常系: ポインターが動くまでホバーをブロックする", () => {
    const { content } = setup()
    expect(isBlocked(content)).toBe(true)

    fireEvent.pointerMove(content)
    expect(isBlocked(content)).toBe(false)
  })

  it("HG-02: 正常系: アニメーション中はポインターが動いてもブロックし、終了後の移動で解除する", () => {
    const { content } = setup()
    fireEvent.animationStart(content)
    fireEvent.pointerMove(content)
    expect(isBlocked(content)).toBe(true)

    fireEvent.animationEnd(content)
    expect(isBlocked(content)).toBe(true)

    fireEvent.pointerMove(content)
    expect(isBlocked(content)).toBe(false)
  })

  it("HG-03: 正常系: 新しいアニメーションが始まると再びブロックする", () => {
    const { content } = setup()
    fireEvent.pointerMove(content)
    expect(isBlocked(content)).toBe(false)

    fireEvent.animationStart(content)
    expect(isBlocked(content)).toBe(true)
  })

  it("HG-04: 境界値: 子孫要素のアニメーションイベントは無視する", () => {
    const { content, child } = setup()
    fireEvent.pointerMove(content)

    fireEvent.animationStart(child)
    expect(isBlocked(content)).toBe(false)

    fireEvent.animationStart(content)
    fireEvent.animationEnd(child)
    fireEvent.pointerMove(content)
    expect(isBlocked(content)).toBe(true)
  })

  it("HG-05: 正常系: 子孫要素上のポインター移動でも解除する", () => {
    const { content, child } = setup()
    fireEvent.pointerMove(child)
    expect(isBlocked(content)).toBe(false)
  })
})
