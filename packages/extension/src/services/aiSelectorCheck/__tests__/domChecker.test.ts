import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { checkSelectorsInDocument, type CheckTarget } from "../domChecker"
import { PAGE_STATE } from "../pageState"
import { SELECTOR_KIND, VERDICT, type ServiceCheckResult } from "../result"

// The voice mode button turns into the send button on input.
const target: CheckTarget = {
  id: "svc",
  name: "Service",
  url: "https://example.com",
  inputSelectors: ["#missing", "textarea#prompt"],
  submitSelectors: ["button#voice", "button#send"],
}

const options = {
  inputTimeoutMs: 0,
  submitTimeoutMs: 0,
  settleMs: 0,
  pollIntervalMs: 1,
}

const groupOf = (
  result: ServiceCheckResult,
  kind: (typeof SELECTOR_KIND)[keyof typeof SELECTOR_KIND],
) => result.groups.find((g) => g.kind === kind)

describe("checkSelectorsInDocument", () => {
  let execCommand: ReturnType<typeof vi.fn>

  /**
   * Simulate a composer whose button depends on the input:
   * `emptyButton` while empty, `filledButton` while it has text.
   */
  const setUpComposer = (emptyButton: string, filledButton: string) => {
    document.body.innerHTML = `<textarea id="prompt"></textarea><div id="actions">${emptyButton}</div>`
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement
    const actions = document.querySelector("#actions") as HTMLElement
    execCommand.mockImplementation((command: string, _ui, value?: string) => {
      if (command === "insertText") {
        textarea.value = value ?? ""
        actions.innerHTML = filledButton
      }
      if (command === "delete") {
        textarea.value = ""
        actions.innerHTML = emptyButton
      }
      return true
    })
    return textarea
  }

  beforeEach(() => {
    execCommand = vi.fn(() => true)
    // jsdom does not implement execCommand.
    Object.defineProperty(document, "execCommand", {
      value: execCommand,
      configurable: true,
    })
    document.title = "Service"
  })

  afterEach(() => {
    document.body.innerHTML = ""
  })

  it("passes when the button matches both before and after input", async () => {
    const textarea = setUpComposer(
      `<button id="voice"></button>`,
      `<button id="send"></button>`,
    )

    const result = await checkSelectorsInDocument(target, options)

    expect(result.verdict).toBe(VERDICT.PASS)
    expect(result.snapshot).toBeUndefined()
    expect(groupOf(result, SELECTOR_KIND.INPUT)?.matches).toEqual([
      { selector: "#missing", found: false },
      { selector: "textarea#prompt", found: true },
    ])
    expect(groupOf(result, SELECTOR_KIND.SUBMIT_INITIAL)?.matches).toEqual([
      { selector: "button#voice", found: true },
      { selector: "button#send", found: false },
    ])
    expect(groupOf(result, SELECTOR_KIND.SUBMIT_AFTER_INPUT)?.matches).toEqual([
      { selector: "button#voice", found: false },
      { selector: "button#send", found: true },
    ])
    // The dummy text is typed and removed again.
    expect(execCommand).toHaveBeenCalledWith(
      "insertText",
      false,
      "selector check",
    )
    expect(execCommand).toHaveBeenCalledWith("delete")
    expect(textarea.value).toBe("")
  })

  it("fails when the button matches only before input", async () => {
    setUpComposer(
      `<button id="voice"></button>`,
      `<button id="other"></button>`,
    )

    const result = await checkSelectorsInDocument(target, options)

    expect(result.verdict).toBe(VERDICT.FAIL)
    expect(groupOf(result, SELECTOR_KIND.SUBMIT_AFTER_INPUT)?.matches).toEqual([
      { selector: "button#voice", found: false },
      { selector: "button#send", found: false },
    ])
  })

  it("fails when the button matches only after input", async () => {
    setUpComposer(`<button id="other"></button>`, `<button id="send"></button>`)

    const result = await checkSelectorsInDocument(target, options)

    expect(result.verdict).toBe(VERDICT.FAIL)
    expect(
      groupOf(result, SELECTOR_KIND.SUBMIT_INITIAL)?.matches.some(
        (m) => m.found,
      ),
    ).toBe(false)
  })

  it("skips the initial state and leaves a draft untouched", async () => {
    document.body.innerHTML = `<textarea id="prompt">draft</textarea><button id="send"></button>`

    const result = await checkSelectorsInDocument(target, options)

    expect(execCommand).not.toHaveBeenCalled()
    expect(groupOf(result, SELECTOR_KIND.SUBMIT_INITIAL)?.skipped).toBe(true)
    expect(result.verdict).toBe(VERDICT.PASS)
  })

  it.each([
    [
      "a non-editable placeholder node",
      `<p><span contenteditable="false">Ask anything</span><br></p>`,
    ],
    [
      "a hidden placeholder node",
      `<p><span aria-hidden="true">Ask anything</span></p>`,
    ],
  ])(
    "treats a contenteditable with %s as empty",
    async (_label, placeholder) => {
      document.body.innerHTML = `<div id="editor" contenteditable="true">${placeholder}</div><button id="voice"></button>`

      const result = await checkSelectorsInDocument(
        { ...target, inputSelectors: ["#editor"] },
        options,
      )

      // Empty, so the dummy text is typed and the initial state is checked.
      expect(execCommand).toHaveBeenCalledWith(
        "insertText",
        false,
        "selector check",
      )
      expect(groupOf(result, SELECTOR_KIND.SUBMIT_INITIAL)?.skipped).toBe(
        undefined,
      )
    },
  )

  it("treats a contenteditable with typed text as a draft", async () => {
    document.body.innerHTML = `<div id="editor" contenteditable="true"><p>draft</p></div><button id="send"></button>`

    const result = await checkSelectorsInDocument(
      { ...target, inputSelectors: ["#editor"] },
      options,
    )

    expect(execCommand).not.toHaveBeenCalled()
    expect(groupOf(result, SELECTOR_KIND.SUBMIT_INITIAL)?.skipped).toBe(true)
  })

  it("leaves the page unclassified with a snapshot when no input matches", async () => {
    document.body.innerHTML = `<button id="voice"></button>`

    const result = await checkSelectorsInDocument(target, options)

    // The caller classifies the page with Gemini; until then it is treated
    // like blocked so that a challenge page is never reported as broken.
    expect(result.pageState).toBe(PAGE_STATE.UNCLASSIFIED)
    expect(result.verdict).toBe(VERDICT.BLOCKED)
    expect(result.snapshot).toMatchObject({ title: "Service" })
    expect(groupOf(result, SELECTOR_KIND.SUBMIT_AFTER_INPUT)?.skipped).toBe(
      true,
    )
    expect(execCommand).not.toHaveBeenCalled()
  })

  it("waits for an editor that reflects the input asynchronously", async () => {
    // Lexical (Perplexity) updates the DOM in a later task.
    document.body.innerHTML = `<textarea id="prompt"></textarea><div id="actions"><button id="voice"></button></div>`
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement
    const actions = document.querySelector("#actions") as HTMLElement
    execCommand.mockImplementation((command: string, _ui, value?: string) => {
      if (command === "insertText") {
        setTimeout(() => {
          textarea.value = value ?? ""
          actions.innerHTML = `<button id="send"></button>`
        }, 20)
      }
      if (command === "delete") textarea.value = ""
      return true
    })

    const result = await checkSelectorsInDocument(target, {
      ...options,
      reflectTimeoutMs: 500,
    })

    expect(result.verdict).toBe(VERDICT.PASS)
    expect(textarea.value).toBe("")
  })

  describe("when the dummy text can't be typed", () => {
    beforeEach(() => {
      document.body.innerHTML = `<textarea id="prompt"></textarea><button id="voice"></button>`
    })

    it.each([
      ["execCommand returns false", () => false],
      // The editor ignored the input although execCommand succeeded.
      ["nothing is entered", () => true],
    ])("returns an error when %s", async (_label, impl) => {
      execCommand.mockImplementation(impl)

      const result = await checkSelectorsInDocument(target, options)

      // Not "skipped": the service must not pass without the after-input state.
      expect(result.verdict).toBe(VERDICT.ERROR)
      expect(result.error).toBe("Could not type a dummy text into the input")
      expect(groupOf(result, SELECTOR_KIND.SUBMIT_INITIAL)?.matches).toEqual([
        { selector: "button#voice", found: true },
        { selector: "button#send", found: false },
      ])
      expect(groupOf(result, SELECTOR_KIND.SUBMIT_AFTER_INPUT)).toBeUndefined()
      // Nothing was typed, so nothing is deleted.
      expect(execCommand).not.toHaveBeenCalledWith("delete")
    })

    it("still removes the dummy text when typing throws", async () => {
      const textarea = document.querySelector("textarea") as HTMLTextAreaElement
      execCommand.mockImplementation((command: string, _ui, value?: string) => {
        if (command === "insertText") {
          textarea.value = value ?? ""
          throw new Error("editor crashed")
        }
        if (command === "delete") textarea.value = ""
        return true
      })

      const result = await checkSelectorsInDocument(target, options)

      expect(result.verdict).toBe(VERDICT.ERROR)
      expect(execCommand).toHaveBeenCalledWith("delete")
      expect(textarea.value).toBe("")
    })
  })

  it("fails a group containing an invalid selector", async () => {
    setUpComposer(`<button id="voice"></button>`, `<button id="send"></button>`)

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
