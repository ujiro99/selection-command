import { describe, it, expect, afterEach } from "vitest"
import { SelectorType } from "@/const"
import { queryElement } from "./queryElement"

describe("queryElement", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  describe("css selector", () => {
    it("QE-01: returns the element matching a single CSS selector", () => {
      document.body.innerHTML = `<button id="a">A</button>`
      const el = queryElement("#a", SelectorType.css)
      expect(el?.id).toBe("a")
    })

    it("QE-02: returns null when no element matches", () => {
      document.body.innerHTML = `<button id="a">A</button>`
      const el = queryElement("#not-found", SelectorType.css)
      expect(el).toBeNull()
    })

    it("QE-03: tries comma-separated selectors in order and returns the first match found", () => {
      document.body.innerHTML = `<button id="second">Second</button>`
      const el = queryElement("#first, #second", SelectorType.css)
      expect(el?.id).toBe("second")
    })

    it("QE-04: prefers the earlier selector in the list even when a later one matches an earlier DOM element", () => {
      // Native `document.querySelector("#first, #second")` would return
      // "second" here (first match in document order). queryElement instead
      // checks each selector segment in list order, so "first" wins even
      // though it appears later in the DOM. This deliberate deviation is
      // the behavior this test pins down.
      document.body.innerHTML = `<button id="second">Second</button><button id="first">First</button>`
      const nativeMatch = document.querySelector("#first, #second")
      expect(nativeMatch?.id).toBe("second")

      const el = queryElement("#first, #second", SelectorType.css)
      expect(el?.id).toBe("first")
    })

    it("QE-05: trims whitespace around comma-separated selectors", () => {
      document.body.innerHTML = `<button id="a">A</button>`
      const el = queryElement("  #missing ,   #a  ", SelectorType.css)
      expect(el?.id).toBe("a")
    })
  })

  describe("xpath selector", () => {
    it("QE-06: returns the element matching a valid XPath", () => {
      document.body.innerHTML = `<button id="a">Click</button>`
      const el = queryElement("//button[@id='a']", SelectorType.xpath)
      expect(el?.id).toBe("a")
    })

    it("QE-07: returns null when the XPath is valid but matches nothing", () => {
      document.body.innerHTML = `<button id="a">Click</button>`
      const el = queryElement("//button[@id='missing']", SelectorType.xpath)
      expect(el).toBeNull()
    })

    it("QE-08: throws for an invalid XPath instead of silently returning null", () => {
      expect(() => queryElement("///[invalid(", SelectorType.xpath)).toThrow(
        /Invalid XPath/,
      )
    })
  })
})
