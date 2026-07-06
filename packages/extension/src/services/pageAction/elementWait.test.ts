import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { SelectorType, PAGE_ACTION_CONDITION_TYPE } from "@/const"
import {
  waitForElement,
  evaluateCondition,
  waitForCondition,
  resolveWaitUntilCondition,
} from "./elementWait"

vi.mock("@/const", async () => {
  const actual = await vi.importActual("@/const")
  return {
    ...actual,
    PAGE_ACTION_TIMEOUT: 1000, // Reduce timeout for faster tests
  }
})

// jsdom doesn't perform layout, so getBoundingClientRect always reports zero
// size; stub it to simulate a rendered, sized element.
function stubSize(element: HTMLElement, width = 10, height = 10) {
  element.getBoundingClientRect = vi.fn(() => ({ width, height }) as DOMRect)
}

describe("elementWait", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ""
  })

  describe("waitForElement", () => {
    it("EW-01: resolves immediately when the element already exists", async () => {
      document.body.innerHTML = `<div id="a"></div>`
      const el = await waitForElement("#a", SelectorType.css)
      expect(el?.id).toBe("a")
    })

    it("EW-02: resolves once the element appears during polling", async () => {
      const promise = waitForElement("#a", SelectorType.css, 1000)
      await vi.advanceTimersByTimeAsync(60)
      document.body.innerHTML = `<div id="a"></div>`
      await vi.advanceTimersByTimeAsync(60)

      const el = await promise
      expect(el?.id).toBe("a")
    })

    it("EW-03: resolves null after the timeout elapses without the element appearing", async () => {
      const promise = waitForElement("#missing", SelectorType.css, 200)
      await vi.advanceTimersByTimeAsync(300)

      const el = await promise
      expect(el).toBeNull()
    })

    it("EW-04: rejects when the selector is invalid (e.g. malformed XPath)", async () => {
      const promise = waitForElement("///[invalid(", SelectorType.xpath, 200)
      await expect(promise).rejects.toMatch(/Invalid XPath/)
    })
  })

  describe("evaluateCondition", () => {
    describe("conditionType: empty", () => {
      it("EW-05: true when the element is null", () => {
        expect(evaluateCondition(PAGE_ACTION_CONDITION_TYPE.empty, null)).toBe(
          true,
        )
      })

      it("EW-06: true when an input's value is empty", () => {
        const input = document.createElement("input")
        input.value = ""
        expect(evaluateCondition(PAGE_ACTION_CONDITION_TYPE.empty, input)).toBe(
          true,
        )
      })

      it("EW-07: false when an input's value is non-empty", () => {
        const input = document.createElement("input")
        input.value = "unsent prompt"
        expect(evaluateCondition(PAGE_ACTION_CONDITION_TYPE.empty, input)).toBe(
          false,
        )
      })

      it("EW-08: true when a textarea's value is empty", () => {
        const textarea = document.createElement("textarea")
        textarea.value = ""
        expect(
          evaluateCondition(PAGE_ACTION_CONDITION_TYPE.empty, textarea),
        ).toBe(true)
      })

      it("EW-09: true when a contenteditable element's textContent is empty", () => {
        const div = document.createElement("div")
        div.textContent = ""
        expect(evaluateCondition(PAGE_ACTION_CONDITION_TYPE.empty, div)).toBe(
          true,
        )
      })

      it("EW-10: false when a contenteditable element's textContent is non-empty", () => {
        const div = document.createElement("div")
        div.textContent = "unsent prompt"
        expect(evaluateCondition(PAGE_ACTION_CONDITION_TYPE.empty, div)).toBe(
          false,
        )
      })
    })

    describe("conditionType: visible", () => {
      it("EW-11: false when the element is null", () => {
        expect(
          evaluateCondition(PAGE_ACTION_CONDITION_TYPE.visible, null),
        ).toBe(false)
      })

      it("EW-12: true when the element is rendered with a non-zero size", () => {
        const div = document.createElement("div")
        stubSize(div)
        expect(evaluateCondition(PAGE_ACTION_CONDITION_TYPE.visible, div)).toBe(
          true,
        )
      })

      it("EW-13: false when the element has zero size (not rendered)", () => {
        const div = document.createElement("div")
        expect(evaluateCondition(PAGE_ACTION_CONDITION_TYPE.visible, div)).toBe(
          false,
        )
      })

      it("EW-14: false when the element is display:none", () => {
        const div = document.createElement("div")
        stubSize(div)
        div.style.display = "none"
        expect(evaluateCondition(PAGE_ACTION_CONDITION_TYPE.visible, div)).toBe(
          false,
        )
      })
    })

    describe("conditionType: clickable", () => {
      it("EW-14b: false when the element is null", () => {
        expect(
          evaluateCondition(PAGE_ACTION_CONDITION_TYPE.clickable, null),
        ).toBe(false)
      })

      it("EW-14c: true when the element is enabled, visible, and hit-testable", () => {
        const button = document.createElement("button")
        stubSize(button)
        expect(
          evaluateCondition(PAGE_ACTION_CONDITION_TYPE.clickable, button),
        ).toBe(true)
      })

      it("EW-14d: false when the element is disabled", () => {
        const button = document.createElement("button")
        button.disabled = true
        stubSize(button)
        expect(
          evaluateCondition(PAGE_ACTION_CONDITION_TYPE.clickable, button),
        ).toBe(false)
      })

      it("EW-14e: false when the element is display:none", () => {
        const button = document.createElement("button")
        stubSize(button)
        button.style.display = "none"
        expect(
          evaluateCondition(PAGE_ACTION_CONDITION_TYPE.clickable, button),
        ).toBe(false)
      })

      it("EW-14f: false when the element has zero size (not rendered)", () => {
        const button = document.createElement("button")
        expect(
          evaluateCondition(PAGE_ACTION_CONDITION_TYPE.clickable, button),
        ).toBe(false)
      })

      it("EW-14g: false when the element has pointer-events:none", () => {
        const button = document.createElement("button")
        stubSize(button)
        button.style.pointerEvents = "none"
        expect(
          evaluateCondition(PAGE_ACTION_CONDITION_TYPE.clickable, button),
        ).toBe(false)
      })
    })
  })

  describe("waitForCondition", () => {
    it("EW-15: resolves true once the condition becomes satisfied during polling", async () => {
      document.body.innerHTML = `<input id="a" value="unsent prompt" />`
      const input = document.querySelector("#a") as HTMLInputElement

      const promise = waitForCondition(
        PAGE_ACTION_CONDITION_TYPE.empty,
        "#a",
        SelectorType.css,
        1000,
      )
      await vi.advanceTimersByTimeAsync(60)
      expect(await Promise.race([promise, Promise.resolve("pending")])).toBe(
        "pending",
      )

      input.value = ""
      await vi.advanceTimersByTimeAsync(60)

      expect((await promise).satisfied).toBe(true)
    })

    it("EW-16: resolves false after the timeout elapses without the condition being met", async () => {
      document.body.innerHTML = `<input id="a" value="unsent prompt" />`

      const promise = waitForCondition(
        PAGE_ACTION_CONDITION_TYPE.empty,
        "#a",
        SelectorType.css,
        200,
      )
      await vi.advanceTimersByTimeAsync(300)

      expect((await promise).satisfied).toBe(false)
    })

    it("EW-16b: uses the default timeout for conditionType=clickable when no explicit timeout is given", async () => {
      document.body.innerHTML = `<button id="a" disabled></button>`
      stubSize(document.querySelector("#a") as HTMLButtonElement)

      // PAGE_ACTION_TIMEOUT is mocked to 1000ms above; clickable no longer
      // gets an implicit longer timeout (that's now the caller's job), so it
      // should time out around 1000ms.
      const promise = waitForCondition(
        PAGE_ACTION_CONDITION_TYPE.clickable,
        "#a",
        SelectorType.css,
      )
      await vi.advanceTimersByTimeAsync(1100)

      expect((await promise).satisfied).toBe(false)
    })
  })

  describe("resolveWaitUntilCondition", () => {
    it("EW-19: resolves without an error once the element becomes clickable", async () => {
      document.body.innerHTML = `<button id="submit" disabled></button>`
      const button = document.querySelector("#submit") as HTMLButtonElement
      stubSize(button)

      const promise = resolveWaitUntilCondition(
        PAGE_ACTION_CONDITION_TYPE.clickable,
        "#submit",
        SelectorType.css,
        "Submit",
      )
      await vi.advanceTimersByTimeAsync(60)

      button.disabled = false
      await vi.advanceTimersByTimeAsync(60)

      expect(await promise).toBeUndefined()
    })

    it("EW-20: returns a 'not clickable' error describing why when the element stays disabled, respecting an explicit timeout", async () => {
      document.body.innerHTML = `<button id="submit" disabled></button>`
      const button = document.querySelector("#submit") as HTMLButtonElement
      stubSize(button)

      // Passing an explicit timeout (as a caller like aiPrompt.ts would)
      // controls how long this waits, independent of the default TIMEOUT.
      const promise = resolveWaitUntilCondition(
        PAGE_ACTION_CONDITION_TYPE.clickable,
        "#submit",
        SelectorType.css,
        "Submit",
        500,
      )
      await vi.advanceTimersByTimeAsync(600)

      expect(await promise).toBe("Element not clickable (disabled): Submit")
    })

    it("EW-21: returns a 'not found' error when the element never appears", async () => {
      const promise = resolveWaitUntilCondition(
        PAGE_ACTION_CONDITION_TYPE.clickable,
        "#missing",
        SelectorType.css,
        "Submit",
        500,
      )
      await vi.advanceTimersByTimeAsync(600)

      expect(await promise).toBe("Element not found: Submit")
    })

    it("EW-21b: never fails for non-clickable condition types, even on timeout", async () => {
      document.body.innerHTML = `<input id="a" value="unsent prompt" />`

      const promise = resolveWaitUntilCondition(
        PAGE_ACTION_CONDITION_TYPE.empty,
        "#a",
        SelectorType.css,
        "Submit",
      )
      await vi.advanceTimersByTimeAsync(1100)

      expect(await promise).toBeUndefined()
    })
  })
})
