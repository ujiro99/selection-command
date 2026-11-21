import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { POPUP_DISABLED_ATTR } from "@/const"
import { __test } from "../useDetectLinkCommand"

const { isTargetEvent } = __test

const createEvent = (target: Element): MouseEvent => {
  const e = new MouseEvent("mousedown", { button: 0, bubbles: true })
  Object.defineProperty(e, "target", { value: target })
  return e
}

describe("useDetectLinkCommand isTargetEvent", () => {
  beforeEach(() => {
    // jsdom does not implement elementsFromPoint.
    document.elementsFromPoint = () => []
  })

  afterEach(() => {
    document.body.innerHTML = ""
  })

  it("DLC-01: returns true for a link outside a disabled area", () => {
    document.body.innerHTML = `<a id="link" href="https://example.com">link</a>`
    const e = createEvent(document.getElementById("link")!)
    expect(isTargetEvent(e)).toBe(true)
  })

  it("DLC-02: returns false for a link inside a disabled area", () => {
    document.body.innerHTML = `
      <div ${POPUP_DISABLED_ATTR}>
        <a id="link" href="https://example.com">link</a>
      </div>
    `
    const e = createEvent(document.getElementById("link")!)
    expect(isTargetEvent(e)).toBe(false)
  })

  it("DLC-03: returns false for a button inside a disabled area", () => {
    document.body.innerHTML = `
      <div ${POPUP_DISABLED_ATTR}><button id="btn">btn</button></div>
    `
    const e = createEvent(document.getElementById("btn")!)
    expect(isTargetEvent(e)).toBe(false)
  })
})
