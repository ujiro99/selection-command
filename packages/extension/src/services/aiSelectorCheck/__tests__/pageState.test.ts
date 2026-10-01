import { describe, it, expect } from "vitest"
import { takePageSnapshot } from "../pageState"

describe("takePageSnapshot", () => {
  it("collects url, title and normalized, truncated text", () => {
    document.title = "Just a moment..."
    // jsdom does not implement innerText.
    Object.defineProperty(document.body, "innerText", {
      value: "Verify   you\n are human",
      configurable: true,
    })

    expect(takePageSnapshot(10)).toEqual({
      url: location.href,
      title: "Just a moment...",
      text: "Verify you",
    })
  })
})
