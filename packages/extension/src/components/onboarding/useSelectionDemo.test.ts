import { describe, it, expect, vi } from "vitest"
import { renderHook } from "@testing-library/react"
import { createRef } from "react"
import {
  buildKeyframes,
  useSelectionDemo,
  type LineRect,
} from "./useSelectionDemo"

describe("buildKeyframes", () => {
  const host: LineRect = { x: 0, y: 0, width: 500, height: 200 }

  it("returns an empty array for no lines", () => {
    expect(buildKeyframes([], host)).toEqual([])
  })

  it("starts at the line's start and holds at its end for a single line", () => {
    const line: LineRect = { x: 20, y: 40, width: 300, height: 24 }
    const frames = buildKeyframes([line], host)

    expect(frames[0]).toEqual({
      offset: 0,
      transform: "translate(20px, 40px)",
      opacity: 1,
    })
    const last = frames[frames.length - 1]
    expect(last).toEqual({
      offset: 1,
      transform: "translate(320px, 40px)",
      opacity: 1,
    })
    // Every keyframe stays fully opaque - nothing to hide with one line.
    expect(frames.every((f) => f.opacity === 1)).toBe(true)
  })

  it("subtracts the host origin from line coordinates", () => {
    const shiftedHost: LineRect = { x: 100, y: 50, width: 500, height: 200 }
    const line: LineRect = { x: 120, y: 90, width: 200, height: 24 }
    const frames = buildKeyframes([line], shiftedHost)

    expect(frames[0].transform).toBe("translate(20px, 40px)")
  })

  it("dips opacity to 0 and jumps position between two lines", () => {
    const lines: LineRect[] = [
      { x: 0, y: 0, width: 300, height: 24 },
      { x: 0, y: 30, width: 150, height: 24 },
    ]
    const frames = buildKeyframes(lines, host)

    const zeroOpacityFrames = frames.filter((f) => f.opacity === 0)
    // Two frames dip to opacity 0: end-of-line-1 position, then
    // start-of-line-2 position, both invisible.
    expect(zeroOpacityFrames).toHaveLength(2)
    expect(zeroOpacityFrames[0].transform).toBe("translate(300px, 0px)")
    expect(zeroOpacityFrames[1].transform).toBe("translate(0px, 30px)")

    // Offsets are non-decreasing, as WAAPI requires.
    for (let i = 1; i < frames.length; i++) {
      expect(frames[i].offset as number).toBeGreaterThanOrEqual(
        frames[i - 1].offset as number,
      )
    }

    // Ends on the second line's end position, fully visible.
    const last = frames[frames.length - 1]
    expect(last).toEqual({
      offset: 1,
      transform: "translate(150px, 30px)",
      opacity: 1,
    })
  })

  it("gives a wider line proportionally more of the movement budget", () => {
    const lines: LineRect[] = [
      { x: 0, y: 0, width: 400, height: 24 },
      { x: 0, y: 30, width: 100, height: 24 },
    ]
    const frames = buildKeyframes(lines, host)
    // First line (400/500 of the width) should reach its end-of-line
    // keyframe at a larger offset than the short second line's span.
    const line1End = frames.find(
      (f) => f.transform === "translate(400px, 0px)",
    )!
    // moveFraction = 1 - holdFraction(1200/3000) - gapFraction(0.015) =
    // 0.585; line1 gets 400/500 of it.
    expect(line1End.offset as number).toBeCloseTo(0.468, 3)
  })
})

describe("useSelectionDemo", () => {
  it("does nothing when disabled", () => {
    const textRef = createRef<HTMLElement>()
    const cursorRef = createRef<HTMLElement>()
    expect(() =>
      renderHook(() => useSelectionDemo(textRef, cursorRef, false)),
    ).not.toThrow()
  })

  it("no-ops when the refs aren't attached yet", () => {
    const textRef = createRef<HTMLElement>()
    const cursorRef = createRef<HTMLElement>()
    expect(() =>
      renderHook(() => useSelectionDemo(textRef, cursorRef, true)),
    ).not.toThrow()
  })

  it("no-ops in jsdom, which has no Element.animate, and cleans up without throwing", () => {
    const text = document.createElement("span")
    const cursor = document.createElement("span")
    document.body.append(text, cursor)
    const textRef = { current: text }
    const cursorRef = { current: cursor }

    // jsdom does not implement the Web Animations API.
    expect(typeof cursor.animate).not.toBe("function")

    const { unmount } = renderHook(() =>
      useSelectionDemo(textRef, cursorRef, true),
    )
    expect(() => unmount()).not.toThrow()

    text.remove()
    cursor.remove()
  })

  it("measures and animates when Element.animate is available", () => {
    const text = document.createElement("span")
    text.textContent = "hello"
    const cursor = document.createElement("span")
    const host = document.createElement("div")
    host.append(text, cursor)
    document.body.append(host)

    const animateSpy = vi.fn().mockReturnValue({ cancel: vi.fn() })
    // jsdom has no WAAPI; stub it directly on the element under test.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(cursor as any).animate = animateSpy
    Object.defineProperty(cursor, "offsetParent", {
      value: host,
      configurable: true,
    })
    vi.spyOn(host, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      width: 100,
      height: 40,
      top: 0,
      left: 0,
      right: 100,
      bottom: 40,
      toJSON: () => ({}),
    })
    // jsdom doesn't implement Range.prototype.getClientRects at all (not
    // just a stub - the property is absent), so vi.spyOn has nothing to
    // wrap. Assign it directly instead.
    const originalGetClientRects = Range.prototype.getClientRects
    Range.prototype.getClientRects = vi.fn().mockReturnValue([
      {
        x: 0,
        y: 0,
        width: 60,
        height: 20,
        top: 0,
        left: 0,
        right: 60,
        bottom: 20,
        toJSON: () => ({}),
      },
    ] as unknown as DOMRectList)

    const textRef = { current: text }
    const cursorRef = { current: cursor }
    const { unmount } = renderHook(() =>
      useSelectionDemo(textRef, cursorRef, true),
    )

    expect(animateSpy).toHaveBeenCalledTimes(1)
    const [keyframes, options] = animateSpy.mock.calls[0]
    expect(keyframes.length).toBeGreaterThan(0)
    expect(options).toMatchObject({ iterations: Infinity, easing: "linear" })

    unmount()
    host.remove()
    Range.prototype.getClientRects = originalGetClientRects
    vi.restoreAllMocks()
  })
})
