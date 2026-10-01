import { describe, it, expect, afterEach } from "vitest"
import { hasAnyMatch, matchEach } from "../selectorMatch"

describe("selectorMatch", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  describe("hasAnyMatch", () => {
    it("returns true when any selector matches", () => {
      document.body.innerHTML = `<button id="send"></button>`
      expect(hasAnyMatch(["#voice", "#send"])).toBe(true)
    })

    it("returns false when nothing matches or the list is empty", () => {
      document.body.innerHTML = `<button id="send"></button>`
      expect(hasAnyMatch(["#voice"])).toBe(false)
      expect(hasAnyMatch([])).toBe(false)
    })

    it("returns false when the joined list is invalid, as at runtime", () => {
      document.body.innerHTML = `<button id="send"></button>`
      expect(hasAnyMatch(["button[[", "#send"])).toBe(false)
    })
  })

  describe("matchEach", () => {
    it("matches each selector individually and flags invalid ones", () => {
      document.body.innerHTML = `<button id="send"></button>`
      expect(matchEach(["#send", "#voice", "button[["])).toEqual([
        { selector: "#send", found: true },
        { selector: "#voice", found: false },
        { selector: "button[[", found: false, invalid: true },
      ])
    })
  })
})
