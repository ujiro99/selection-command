import { describe, it, expect, vi, afterEach, beforeEach } from "vitest"
import { inputContentEditable } from "./inputUtils"

/**
 * Helper: create a contenteditable div with selection set inside it.
 */
function createEditableDiv(): HTMLDivElement {
  const div = document.createElement("div")
  div.contentEditable = "true"
  Object.defineProperty(div, "isContentEditable", { value: true })
  document.body.appendChild(div)

  // Set selection inside the div so insertNode works in jsdom
  const range = document.createRange()
  range.selectNodeContents(div)
  range.collapse(false)
  const selection = window.getSelection()!
  selection.removeAllRanges()
  selection.addRange(range)

  return div
}

describe("inputContentEditable", () => {
  beforeEach(() => {
    // jsdom does not implement execCommand, so we define it for legacy mode tests
    if (!document.execCommand) {
      document.execCommand = vi.fn().mockReturnValue(true)
    }
  })

  afterEach(() => {
    document.body.innerHTML = ""
    window.getSelection()?.removeAllRanges()
    vi.restoreAllMocks()
  })

  it("ICE-01: 正常系: 非編集可能要素に対してfalseを返す", async () => {
    const div = document.createElement("div")
    document.body.appendChild(div)
    const result = await inputContentEditable(div, "hello", 0)
    expect(result).toBe(false)
  })

  it("ICE-02: 正常系: contenteditable要素にテキストを入力できる", async () => {
    const div = createEditableDiv()
    const result = await inputContentEditable(div, "hello", 0)
    expect(result).toBe(true)
    expect(div.textContent).toBe("hello")
  })

  it("ICE-03: 正常系: 改行を含むテキストでShift+Enterが発火される", async () => {
    const div = createEditableDiv()
    const events: string[] = []
    div.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.shiftKey) {
        events.push("shift+enter")
      }
    })

    await inputContentEditable(div, "line1\nline2\nline3", 0)
    expect(events).toEqual(["shift+enter", "shift+enter"])
  })

  it("ICE-04: 正常系: legacyModeでexecCommandが使用される", async () => {
    const div = createEditableDiv()
    const execSpy = vi.spyOn(document, "execCommand").mockReturnValue(true)

    await inputContentEditable(div, "hello", 0, null, true)
    expect(execSpy).toHaveBeenCalledWith("insertText", false, "hello")
  })

  it("ICE-05: 正常系: 入力後にInputEvent(insertText)がdispatchされる", async () => {
    const div = createEditableDiv()
    const events: InputEvent[] = []
    div.addEventListener("input", (e) => {
      events.push(e as InputEvent)
    })

    await inputContentEditable(div, "hello", 0)

    const insertTextEvents = events.filter((e) => e.inputType === "insertText")
    expect(insertTextEvents.length).toBe(1)
    expect(insertTextEvents[0].data).toBe("hello")
    expect(insertTextEvents[0].bubbles).toBe(true)
    expect(insertTextEvents[0].cancelable).toBe(false)
  })

  it("ICE-06: 正常系: 改行時にInputEvent(insertLineBreak)がdispatchされる", async () => {
    const div = createEditableDiv()
    const events: InputEvent[] = []
    div.addEventListener("input", (e) => {
      events.push(e as InputEvent)
    })

    await inputContentEditable(div, "line1\nline2", 0)

    const lineBreakEvents = events.filter(
      (e) => e.inputType === "insertLineBreak",
    )
    expect(lineBreakEvents.length).toBe(1)
    expect(lineBreakEvents[0].bubbles).toBe(true)
    expect(lineBreakEvents[0].cancelable).toBe(false)
  })

  it("ICE-07: 正常系: nodeAtCaretを指定するとキャレット位置にテキストが挿入される", async () => {
    const div = createEditableDiv()
    const existingText = document.createTextNode("existing")
    div.appendChild(existingText)

    // Set selection at end of existing text
    const selection = window.getSelection()!
    const range = document.createRange()
    range.setStart(existingText, existingText.length)
    range.setEnd(existingText, existingText.length)
    selection.removeAllRanges()
    selection.addRange(range)

    const result = await inputContentEditable(div, "new", 0, existingText)
    expect(result).toBe(true)
    expect(div.textContent).toContain("new")
  })

  it("ICE-08: 正常系: nodeAtCaretが要素ノードの場合、子テキストノードが使用される", async () => {
    const div = createEditableDiv()
    const span = document.createElement("span")
    span.textContent = "inner"
    div.appendChild(span)

    // Set selection inside div
    const selection = window.getSelection()!
    const range = document.createRange()
    range.selectNodeContents(div)
    range.collapse(false)
    selection.removeAllRanges()
    selection.addRange(range)

    const result = await inputContentEditable(div, "appended", 0, span)
    expect(result).toBe(true)
  })

  it("ICE-09: 正常系: selectionのrangeCountが0の場合、新しいRangeが作成される", async () => {
    const div = createEditableDiv()

    // Mock selection with rangeCount 0 to exercise createRange branch
    const createdRange = document.createRange()
    createdRange.selectNodeContents(div)
    createdRange.collapse(false)
    const createRangeSpy = vi
      .spyOn(document, "createRange")
      .mockReturnValue(createdRange)
    const mockSelection = {
      rangeCount: 0,
      getRangeAt: vi.fn(),
      removeAllRanges: vi.fn(),
      addRange: vi.fn(),
    } as unknown as Selection
    vi.spyOn(window, "getSelection").mockReturnValue(mockSelection)

    const result = await inputContentEditable(div, "hello", 0)
    expect(result).toBe(true)
    expect(createRangeSpy).toHaveBeenCalled()
  })

  it("ICE-10: 正常系: legacyModeで改行を含むテキストの入力", async () => {
    const div = createEditableDiv()
    const execSpy = vi.spyOn(document, "execCommand").mockReturnValue(true)

    await inputContentEditable(div, "line1\nline2", 0, null, true)
    expect(execSpy).toHaveBeenCalledWith("insertText", false, "line1")
    expect(execSpy).toHaveBeenCalledWith("insertText", false, "line2")
  })

  it("ICE-11: 正常系: 空文字列の入力でtrueを返す", async () => {
    const div = createEditableDiv()
    const result = await inputContentEditable(div, "", 0)
    expect(result).toBe(true)
  })

  it("ICE-12: 正常系: nullのnodeAtCaretは無視される", async () => {
    const div = createEditableDiv()
    const result = await inputContentEditable(div, "hello", 0, null)
    expect(result).toBe(true)
    expect(div.textContent).toBe("hello")
  })
})
