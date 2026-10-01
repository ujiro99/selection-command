import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { checkSelectorsInDocument, type CheckTarget } from "../domChecker"
import { PAGE_STATE } from "../pageState"
import { VERDICT } from "../result"

const target: CheckTarget = {
  id: "svc",
  name: "Service",
  url: "https://example.com",
  inputSelectors: ["#missing", "textarea#prompt"],
  submitSelectors: ["button#send"],
}

const options = { inputTimeoutMs: 0, submitTimeoutMs: 0, pollIntervalMs: 1 }

describe("checkSelectorsInDocument", () => {
  let execCommand: ReturnType<typeof vi.fn>

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

  it("passes when input and submit selectors match", async () => {
    document.body.innerHTML = `<textarea id="prompt"></textarea><button id="send"></button>`

    const result = await checkSelectorsInDocument(target, options)

    expect(result.verdict).toBe(VERDICT.PASS)
    expect(result.groups[0].matches).toEqual([
      { selector: "#missing", found: false },
      { selector: "textarea#prompt", found: true },
    ])
    // The submit button already exists, so nothing is typed.
    expect(execCommand).not.toHaveBeenCalled()
  })

  it("leaves the page unclassified with a snapshot when no input matches", async () => {
    document.body.innerHTML = `<button id="send"></button>`

    const result = await checkSelectorsInDocument(target, options)

    // The caller classifies the page with Gemini; until then it is treated
    // like blocked so that a challenge page is never reported as broken.
    expect(result.pageState).toBe(PAGE_STATE.UNCLASSIFIED)
    expect(result.verdict).toBe(VERDICT.BLOCKED)
    expect(result.snapshot).toMatchObject({ title: "Service" })
    expect(result.groups[1].matches).toEqual([
      { selector: "button#send", found: true },
    ])
  })

  it("does not attach a snapshot when the input is found", async () => {
    document.body.innerHTML = `<textarea id="prompt"></textarea><button id="send"></button>`

    const result = await checkSelectorsInDocument(target, options)

    expect(result.snapshot).toBeUndefined()
  })

  it("types a dummy text when the submit button appears only on input, then clears it", async () => {
    document.body.innerHTML = `<textarea id="prompt"></textarea>`
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement
    execCommand.mockImplementation((command: string, _ui, value?: string) => {
      if (command === "insertText") {
        textarea.value = value ?? ""
        document.body.insertAdjacentHTML(
          "beforeend",
          `<button id="send"></button>`,
        )
      }
      if (command === "delete") {
        textarea.value = ""
        document.querySelector("#send")?.remove()
      }
      return true
    })

    const result = await checkSelectorsInDocument(target, options)

    expect(result.verdict).toBe(VERDICT.PASS)
    expect(execCommand).toHaveBeenCalledWith(
      "insertText",
      false,
      "selector check",
    )
    expect(execCommand).toHaveBeenCalledWith("delete")
    expect(textarea.value).toBe("")
  })

  it("does not touch a composer that already has text", async () => {
    document.body.innerHTML = `<textarea id="prompt">draft</textarea>`

    const result = await checkSelectorsInDocument(target, options)

    expect(execCommand).not.toHaveBeenCalled()
    expect(result.pageState).toBe(PAGE_STATE.OK)
    expect(result.verdict).toBe(VERDICT.FAIL)
  })

  it("fails a group containing an invalid selector", async () => {
    document.body.innerHTML = `<textarea id="prompt"></textarea><button id="send"></button>`

    const result = await checkSelectorsInDocument(
      { ...target, submitSelectors: ["button[[", "button#send"] },
      options,
    )

    // The extension joins the list, so one invalid selector breaks it all.
    expect(result.groups[1].matches).toEqual([
      { selector: "button[[", found: false, invalid: true },
      { selector: "button#send", found: true },
    ])
    expect(result.verdict).toBe(VERDICT.FAIL)
  })
})
