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

  it("LCH-03: a click inside a disabled area releases a previous hold", () => {
    const { result } = renderHook(() =>
      useLeftClickHold({ enable: true, holdDuration: HOLD_DURATION }),
    )
    mouseDown(document.getElementById("outside")!)
    act(() => {
      vi.advanceTimersByTime(HOLD_DURATION)
    })
    expect(result.current.detectHold).toBe(true)

    mouseDown(document.getElementById("inside")!)
    act(() => {
      vi.advanceTimersByTime(HOLD_DURATION)
    })
    expect(result.current.detectHold).toBe(false)
  })

  describe("cancelOnMove / anchorOnly", () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <a id="link" href="https://example.com">link</a>
        <button id="button">button</button>
      `
    })

    const mouseDownAt = (target: Element, x = 10, y = 10) => {
      act(() => {
        target.dispatchEvent(
          new MouseEvent("mousedown", {
            button: 0,
            bubbles: true,
            clientX: x,
            clientY: y,
          }),
        )
      })
    }

    const mouseMoveTo = (x: number, y: number) => {
      act(() => {
        window.dispatchEvent(
          new MouseEvent("mousemove", { clientX: x, clientY: y }),
        )
      })
    }

    const advanceHold = () => {
      act(() => {
        vi.advanceTimersByTime(HOLD_DURATION)
      })
    }

    const render = (cancelOnMove: boolean, anchorOnly = false) =>
      renderHook(() =>
        useLeftClickHold({
          enable: true,
          holdDuration: HOLD_DURATION,
          cancelOnMove,
          anchorOnly,
        }),
      )

    it("LCH-04: cancels the hold when the pointer moves beyond the tolerance", () => {
      const { result } = render(true)
      mouseDownAt(document.getElementById("link")!)
      mouseMoveTo(30, 10)
      advanceHold()
      expect(result.current.detectHold).toBe(false)
      expect(result.current.detectHoldLink).toBe(false)
      expect(result.current.progress).toBe(0)
    })

    it("LCH-05: keeps the hold when the pointer moves within the tolerance", () => {
      const { result } = render(true)
      mouseDownAt(document.getElementById("link")!)
      mouseMoveTo(13, 12)
      advanceHold()
      expect(result.current.detectHoldLink).toBe(true)
    })

    it("LCH-06: cancels the hold when a native drag starts", () => {
      const { result } = render(true)
      mouseDownAt(document.getElementById("link")!)
      act(() => {
        window.dispatchEvent(new Event("dragstart"))
      })
      advanceHold()
      expect(result.current.detectHold).toBe(false)
    })

    it("LCH-07: ignores moves when cancelOnMove is off", () => {
      const { result } = render(false)
      mouseDownAt(document.getElementById("link")!)
      mouseMoveTo(100, 100)
      advanceHold()
      expect(result.current.detectHoldLink).toBe(true)
    })

    it("LCH-08: anchorOnly ignores a hold on a button", () => {
      const { result } = render(true, true)
      mouseDownAt(document.getElementById("button")!)
      advanceHold()
      expect(result.current.detectHold).toBe(false)
      expect(result.current.detectHoldLink).toBe(false)
    })

    it("LCH-09: anchorOnly still detects a hold on a link", () => {
      const { result } = render(true, true)
      mouseDownAt(document.getElementById("link")!)
      advanceHold()
      expect(result.current.detectHoldLink).toBe(true)
      expect(result.current.linkElement?.id).toBe("link")
    })

    it("LCH-10: without anchorOnly a hold on a button is detected", () => {
      const { result } = render(true)
      mouseDownAt(document.getElementById("button")!)
      advanceHold()
      expect(result.current.detectHoldLink).toBe(true)
    })
  })
})
