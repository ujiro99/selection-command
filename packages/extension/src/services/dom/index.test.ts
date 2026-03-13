import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  getSelectionText,
  getInputSelectionEndPoint,
  getEditableSelectionEndPoint,
  isInputOrTextarea,
  isEditable,
} from "./index"

describe("getSelectionText", () => {
  afterEach(() => {
    document.body.innerHTML = ""
    window.getSelection()?.removeAllRanges()
  })

  it("GST-01: returns selected text from input element", () => {
    const input = document.createElement("input")
    input.type = "text"
    input.value = "hello world"
    document.body.appendChild(input)
    input.focus()
    input.setSelectionRange(0, 5)

    const result = getSelectionText()
    expect(result).toBe("hello")
  })

  it("GST-02: returns selected text from textarea element", () => {
    const textarea = document.createElement("textarea")
    textarea.value = "foo bar baz"
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.setSelectionRange(4, 7)

    const result = getSelectionText()
    expect(result).toBe("bar")
  })

  it("GST-03: returns trimmed selected text from input", () => {
    const input = document.createElement("input")
    input.type = "text"
    input.value = "  hello  "
    document.body.appendChild(input)
    input.focus()
    input.setSelectionRange(0, 9)

    const result = getSelectionText()
    expect(result).toBe("hello")
  })

  it("GST-04: returns empty string when nothing is selected", () => {
    const result = getSelectionText()
    expect(result).toBe("")
  })

  it("GST-05: returns selected text from normal DOM selection", () => {
    const p = document.createElement("p")
    p.textContent = "hello world"
    document.body.appendChild(p)

    const range = document.createRange()
    range.setStart(p.firstChild!, 0)
    range.setEnd(p.firstChild!, 5)
    const selection = window.getSelection()!
    selection.removeAllRanges()
    selection.addRange(range)

    const result = getSelectionText()
    expect(result).toBe("hello")
  })

  it("GST-06: returns empty string when input has no selection range", () => {
    const input = document.createElement("input")
    input.type = "text"
    input.value = "hello"
    document.body.appendChild(input)
    input.focus()
    // No setSelectionRange called, selectionStart === selectionEnd === 0
    input.setSelectionRange(0, 0)

    const result = getSelectionText()
    expect(result).toBe("")
  })
})

describe("getInputSelectionEndPoint", () => {
  let input: HTMLInputElement
  let textarea: HTMLTextAreaElement

  beforeEach(() => {
    input = document.createElement("input")
    input.type = "text"
    input.value = "hello world"
    document.body.appendChild(input)

    textarea = document.createElement("textarea")
    textarea.value = "line1\nline2\nline3"
    document.body.appendChild(textarea)
  })

  afterEach(() => {
    document.body.innerHTML = ""
  })

  it("GISEP-01: returns coordinates for input with selection", () => {
    input.focus()
    input.setSelectionRange(0, 5)

    const result = getInputSelectionEndPoint(input)
    // In jsdom, getBoundingClientRect returns zeros, but the function
    // should still return a Point (not null)
    expect(result).not.toBeNull()
    expect(result).toHaveProperty("x")
    expect(result).toHaveProperty("y")
  })

  it("GISEP-02: backward selection uses selectionStart as caretPos", () => {
    input.focus()
    input.setSelectionRange(2, 5, "backward")

    // The function should not throw and should return a point
    const result = getInputSelectionEndPoint(input)
    expect(result).not.toBeNull()
    expect(result).toHaveProperty("x")
    expect(result).toHaveProperty("y")
  })

  it("GISEP-03: returns null when selectionEnd is null", () => {
    // Create a mock input where selectionEnd is null
    const mockInput = document.createElement("input")
    mockInput.type = "file" // file inputs have null selectionEnd
    document.body.appendChild(mockInput)

    // File inputs throw on selectionEnd access, so we use a mock
    const fakeInput = {
      selectionEnd: null,
    } as unknown as HTMLInputElement

    const result = getInputSelectionEndPoint(fakeInput)
    expect(result).toBeNull()
  })

  it("GISEP-04: works with textarea element", () => {
    textarea.focus()
    textarea.setSelectionRange(0, 5)

    const result = getInputSelectionEndPoint(textarea)
    expect(result).not.toBeNull()
    expect(result).toHaveProperty("x")
    expect(result).toHaveProperty("y")
  })

  it("GISEP-05: cleans up mirror div after measurement", () => {
    input.focus()
    input.setSelectionRange(0, 5)

    const childCountBefore = document.body.children.length
    getInputSelectionEndPoint(input)
    const childCountAfter = document.body.children.length

    expect(childCountAfter).toBe(childCountBefore)
  })
})

describe("getEditableSelectionEndPoint", () => {
  afterEach(() => {
    document.body.innerHTML = ""
    window.getSelection()?.removeAllRanges()
  })

  it("GESEP-01: returns null when rangeCount is 0", () => {
    // Ensure no selection exists
    window.getSelection()?.removeAllRanges()

    const result = getEditableSelectionEndPoint()
    expect(result).toBeNull()
  })

  it("GESEP-02: returns null when selection is null", () => {
    // Mock getSelection to return null
    vi.spyOn(window, "getSelection").mockReturnValue(null)

    const result = getEditableSelectionEndPoint()
    expect(result).toBeNull()

    vi.mocked(window.getSelection).mockRestore()
  })

  it("GESEP-03: returns null when focusNode is null", () => {
    // Create a selection mock where focusNode is null
    const mockSelection = {
      rangeCount: 1,
      focusNode: null,
      focusOffset: 0,
      getRangeAt: vi.fn().mockReturnValue({
        cloneRange: vi.fn().mockReturnValue({
          setStart: vi.fn(),
          setEnd: vi.fn(),
          getBoundingClientRect: vi
            .fn()
            .mockReturnValue({ width: 0, height: 0, left: 0, bottom: 0 }),
        }),
      }),
    } as unknown as Selection
    vi.spyOn(window, "getSelection").mockReturnValue(mockSelection)

    const result = getEditableSelectionEndPoint()
    expect(result).toBeNull()

    vi.mocked(window.getSelection).mockRestore()
  })

  it("GESEP-04: returns coordinates when selection range has valid rect", () => {
    // Mock getSelection to return a fully controlled selection with valid rect
    const mockEndRange = {
      setStart: vi.fn(),
      setEnd: vi.fn(),
      getBoundingClientRect: vi.fn().mockReturnValue({
        width: 1,
        height: 16,
        left: 100,
        bottom: 120,
        top: 104,
        right: 101,
      }),
    }
    const mockRange = {
      cloneRange: vi.fn().mockReturnValue(mockEndRange),
    }
    const mockSel = {
      rangeCount: 1,
      focusNode: document.createTextNode("hello"),
      focusOffset: 3,
      getRangeAt: vi.fn().mockReturnValue(mockRange),
    } as unknown as Selection
    vi.spyOn(window, "getSelection").mockReturnValue(mockSel)

    const result = getEditableSelectionEndPoint()
    expect(result).toEqual({ x: 100, y: 120 })

    vi.mocked(window.getSelection).mockRestore()
  })
})

describe("isInputOrTextarea", () => {
  it("IIOT-01: returns true for text input", () => {
    const input = document.createElement("input")
    input.type = "text"
    expect(isInputOrTextarea(input)).toBe(true)
  })

  it("IIOT-02: returns true for textarea", () => {
    const textarea = document.createElement("textarea")
    expect(isInputOrTextarea(textarea)).toBe(true)
  })

  it("IIOT-03: returns false for checkbox input", () => {
    const input = document.createElement("input")
    input.type = "checkbox"
    expect(isInputOrTextarea(input)).toBe(false)
  })

  it("IIOT-04: returns false for null", () => {
    expect(isInputOrTextarea(null)).toBe(false)
  })

  it("IIOT-05: returns false for div element", () => {
    const div = document.createElement("div")
    expect(isInputOrTextarea(div)).toBe(false)
  })

  it("IIOT-06: returns true for url input", () => {
    const input = document.createElement("input")
    input.type = "url"
    expect(isInputOrTextarea(input)).toBe(true)
  })

  it("IIOT-07: returns true for search input", () => {
    const input = document.createElement("input")
    input.type = "search"
    expect(isInputOrTextarea(input)).toBe(true)
  })
})

describe("isEditable", () => {
  it("IE-01: returns true for contenteditable element", () => {
    const div = document.createElement("div")
    div.contentEditable = "true"
    document.body.appendChild(div)
    // jsdom does not implement isContentEditable, so we mock it
    Object.defineProperty(div, "isContentEditable", { value: true })
    expect(isEditable(div)).toBe(true)
    document.body.removeChild(div)
  })

  it("IE-02: returns false for non-editable element", () => {
    const div = document.createElement("div")
    expect(isEditable(div)).toBeFalsy()
  })

  it("IE-03: returns false for non-HTMLElement", () => {
    expect(isEditable("string")).toBe(false)
    expect(isEditable(null)).toBe(false)
  })
})
