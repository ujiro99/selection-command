import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

vi.mock("@/services/dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/dom")>()
  return {
    ...actual,
    inputContentEditable: vi.fn(actual.inputContentEditable),
  }
})

import { inputContentEditable } from "@/services/dom"
import { checkSelectorsInDocument, type CheckTarget } from "../domChecker"
import { PAGE_STATE } from "../pageState"
import { SELECTOR_KIND, VERDICT, type ServiceCheckResult } from "../result"

// The voice mode button turns into the send button on input.
const target: CheckTarget = {
  id: "svc",
  name: "Service",
  url: "https://example.com",
  inputSelectors: ["#missing", "#prompt"],
  submitSelectors: ["button#voice", "button#send"],
}

const options = {
  inputTimeoutMs: 0,
  submitTimeoutMs: 0,
  settleMs: 0,
  pollIntervalMs: 1,
}

const VOICE = `<button id="voice"></button>`
const SEND = `<button id="send"></button>`

const groupOf = (
  result: ServiceCheckResult,
  kind: (typeof SELECTOR_KIND)[keyof typeof SELECTOR_KIND],
) => result.groups.find((g) => g.kind === kind)

/**
 * Simulate a composer whose button depends on the input, updated on input
 * events like real editors: `emptyButton` while empty, `filledButton` while
 * it has text. Returns the input types the composer received.
 */
const setUpComposer = (
  inputHtml: string,
  emptyButton: string,
  filledButton: string,
) => {
  document.body.innerHTML = `${inputHtml}<div id="actions">${emptyButton}</div>`
  const input = document.querySelector("#prompt") as HTMLElement
  // jsdom does not implement isContentEditable.
  Object.defineProperty(input, "isContentEditable", {
    value: input.getAttribute("contenteditable") === "true",
  })
  const actions = document.querySelector("#actions") as HTMLElement
  const inputTypes: string[] = []
  input.addEventListener("input", (e) => {
    inputTypes.push((e as InputEvent).inputType)
    const value =
      input instanceof HTMLTextAreaElement ? input.value : input.textContent
    actions.innerHTML = value?.trim() ? filledButton : emptyButton
  })
  return { input, inputTypes }
}

const TEXTAREA = `<textarea id="prompt"></textarea>`
const EDITOR = `<div id="prompt" contenteditable="true"><p></p></div>`

describe("checkSelectorsInDocument", () => {
  beforeEach(() => {
    document.title = "Service"
    vi.mocked(inputContentEditable).mockClear()
  })

  afterEach(() => {
    document.body.innerHTML = ""
  })

  it.each([
    ["a textarea", TEXTAREA],
    ["a contenteditable", EDITOR],
  ])(
    "passes when the button of %s matches before and after input",
    async (_label, inputHtml) => {
      const { input, inputTypes } = setUpComposer(inputHtml, VOICE, SEND)

      const result = await checkSelectorsInDocument(target, options)

      expect(result.verdict).toBe(VERDICT.PASS)
      expect(result.snapshot).toBeUndefined()
      expect(groupOf(result, SELECTOR_KIND.INPUT)?.matches).toEqual([
        { selector: "#missing", found: false },
        { selector: "#prompt", found: true },
      ])
      expect(groupOf(result, SELECTOR_KIND.SUBMIT_INITIAL)?.matches).toEqual([
        { selector: "button#voice", found: true },
        { selector: "button#send", found: false },
      ])
      expect(
        groupOf(result, SELECTOR_KIND.SUBMIT_AFTER_INPUT)?.matches,
      ).toEqual([
        { selector: "button#voice", found: false },
        { selector: "button#send", found: true },
      ])
      // The dummy text is typed and removed again, notifying the editor.
      expect(inputTypes).toEqual(["insertText", "deleteContentBackward"])
      const left =
        input instanceof HTMLTextAreaElement ? input.value : input.textContent
      expect(left).toBe("")
      expect(document.querySelector("#voice")).not.toBeNull()
    },
  )

  it("types into a contenteditable with inputContentEditable", async () => {
    const { input } = setUpComposer(EDITOR, VOICE, SEND)

    await checkSelectorsInDocument(target, options)

    expect(inputContentEditable).toHaveBeenCalledWith(
      input,
      "selector check",
      0,
      null,
    )
  })

  it("fails when the button matches only before input", async () => {
    setUpComposer(TEXTAREA, VOICE, `<button id="other"></button>`)

    const result = await checkSelectorsInDocument(target, options)

    expect(result.verdict).toBe(VERDICT.FAIL)
    expect(groupOf(result, SELECTOR_KIND.SUBMIT_AFTER_INPUT)?.matches).toEqual([
      { selector: "button#voice", found: false },
      { selector: "button#send", found: false },
    ])
  })

  it("fails when the button matches only after input", async () => {
    setUpComposer(TEXTAREA, `<button id="other"></button>`, SEND)

    const result = await checkSelectorsInDocument(target, options)

    expect(result.verdict).toBe(VERDICT.FAIL)
    expect(
      groupOf(result, SELECTOR_KIND.SUBMIT_INITIAL)?.matches.some(
        (m) => m.found,
      ),
    ).toBe(false)
  })

  it.each([
    ["a textarea", `<textarea id="prompt">draft</textarea>`],
    [
      "a contenteditable",
      `<div id="prompt" contenteditable="true"><p>draft</p></div>`,
    ],
  ])(
    "skips the initial state and leaves a draft in %s untouched",
    async (_label, inputHtml) => {
      const { inputTypes } = setUpComposer(inputHtml, SEND, SEND)

      const result = await checkSelectorsInDocument(target, options)

      expect(inputTypes).toEqual([])
      expect(groupOf(result, SELECTOR_KIND.SUBMIT_INITIAL)?.skipped).toBe(true)
      expect(result.verdict).toBe(VERDICT.PASS)
    },
  )

  it.each([
    ["non-editable", `<span contenteditable="false">Ask anything</span>`],
    ["hidden", `<span aria-hidden="true">Ask anything</span>`],
  ])(
    "treats a %s placeholder node as empty and leaves it untouched",
    async (_label, placeholder) => {
      const { input } = setUpComposer(
        `<div id="prompt" contenteditable="true"><p>${placeholder}</p></div>`,
        VOICE,
        SEND,
      )

      const result = await checkSelectorsInDocument(target, options)

      // Typed (initial state not skipped), and only the dummy text removed.
      expect(groupOf(result, SELECTOR_KIND.SUBMIT_INITIAL)?.skipped).toBe(
        undefined,
      )
      expect(inputContentEditable).toHaveBeenCalled()
      expect(input.textContent).toBe("Ask anything")
    },
  )

  it("leaves the page unclassified with a snapshot when no input matches", async () => {
    document.body.innerHTML = VOICE

    const result = await checkSelectorsInDocument(target, options)

    // The caller classifies the page with Gemini; until then it is treated
    // like blocked so that a challenge page is never reported as broken.
    expect(result.pageState).toBe(PAGE_STATE.UNCLASSIFIED)
    expect(result.verdict).toBe(VERDICT.BLOCKED)
    expect(result.snapshot).toMatchObject({ title: "Service" })
    expect(groupOf(result, SELECTOR_KIND.SUBMIT_AFTER_INPUT)?.skipped).toBe(
      true,
    )
    expect(inputContentEditable).not.toHaveBeenCalled()
  })

  it("waits for an editor that reflects the input asynchronously", async () => {
    // Like Lexical: the editor re-renders the DOM from its own state in a
    // later task, so the typed text disappears for a moment.
    const { input } = setUpComposer(EDITOR, VOICE, SEND)
    input.addEventListener("input", (e) => {
      if ((e as InputEvent).inputType !== "insertText") return
      const text = input.textContent ?? ""
      input.innerHTML = "<p></p>"
      setTimeout(() => {
        input.innerHTML = `<p>${text}</p>`
        document.querySelector("#actions")!.innerHTML = SEND
      }, 20)
    })

    const result = await checkSelectorsInDocument(target, {
      ...options,
      reflectTimeoutMs: 500,
    })

    expect(result.verdict).toBe(VERDICT.PASS)
    expect(input.textContent).toBe("")
  })

  describe("when the dummy text can't be typed", () => {
    it("returns an error when the editor rejects the input", async () => {
      const { input } = setUpComposer(EDITOR, VOICE, SEND)
      input.addEventListener("input", () => {
        input.innerHTML = "<p></p>"
      })

      const result = await checkSelectorsInDocument(target, options)

      // Not "skipped": the service must not pass without the after-input state.
      expect(result.verdict).toBe(VERDICT.ERROR)
      expect(result.error).toBe("Could not type a dummy text into the input")
      expect(groupOf(result, SELECTOR_KIND.SUBMIT_INITIAL)?.matches).toEqual([
        { selector: "button#voice", found: true },
        { selector: "button#send", found: false },
      ])
      expect(groupOf(result, SELECTOR_KIND.SUBMIT_AFTER_INPUT)).toBeUndefined()
    })

    it("returns an error when the input is not editable", async () => {
      // Matches inputSelectors, but is neither a text control nor editable.
      setUpComposer(`<div id="prompt"></div>`, VOICE, SEND)

      const result = await checkSelectorsInDocument(target, options)

      expect(result.verdict).toBe(VERDICT.ERROR)
      await expect(
        vi.mocked(inputContentEditable).mock.results[0].value,
      ).resolves.toBe(false)
    })

    it("still removes the dummy text when typing throws", async () => {
      const { input } = setUpComposer(EDITOR, VOICE, SEND)
      vi.mocked(inputContentEditable).mockImplementationOnce(async (el) => {
        el.querySelector("p")!.append("selector check")
        throw new Error("editor crashed")
      })

      const result = await checkSelectorsInDocument(target, options)

      expect(result.verdict).toBe(VERDICT.ERROR)
      expect(input.textContent).toBe("")
    })
  })

  it("fails a group containing an invalid selector", async () => {
    setUpComposer(TEXTAREA, VOICE, SEND)

    const result = await checkSelectorsInDocument(
      {
        ...target,
        submitSelectors: ["button[[", "button#voice", "button#send"],
      },
      options,
    )

    // The extension joins the list, so one invalid selector breaks it all.
    expect(groupOf(result, SELECTOR_KIND.SUBMIT_INITIAL)?.matches[0]).toEqual({
      selector: "button[[",
      found: false,
      invalid: true,
    })
    expect(result.verdict).toBe(VERDICT.FAIL)
  })
})
