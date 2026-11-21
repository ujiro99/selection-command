import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { POPUP_DISABLED_ATTR } from "@/const"
import { useLeftClickHold } from "../useLeftClickHold"

const HOLD_DURATION = 200

const mouseDown = (target: Element) => {
  act(() => {
    target.dispatchEvent(
      new MouseEvent("mousedown", { button: 0, bubbles: true }),
    )
  })
}

describe("useLeftClickHold", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // jsdom does not implement elementsFromPoint.
    document.elementsFromPoint = () => []
    document.body.innerHTML = `
      <p id="outside">outside</p>
      <div ${POPUP_DISABLED_ATTR}><p id="inside">inside</p></div>
    `
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ""
  })

  it("LCH-01: detects a hold outside a disabled area", () => {
    const { result } = renderHook(() =>
      useLeftClickHold({ enable: true, holdDuration: HOLD_DURATION }),
    )
    mouseDown(document.getElementById("outside")!)
    act(() => {
      vi.advanceTimersByTime(HOLD_DURATION)
    })
    expect(result.current.detectHold).toBe(true)
  })

  it("LCH-02: ignores a hold inside a disabled area", () => {
    const { result } = renderHook(() =>
      useLeftClickHold({ enable: true, holdDuration: HOLD_DURATION }),
    )
    mouseDown(document.getElementById("inside")!)
    act(() => {
      vi.advanceTimersByTime(HOLD_DURATION)
    })
    expect(result.current.detectHold).toBe(false)
  })
})
