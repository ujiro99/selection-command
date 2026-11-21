import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, act } from "@testing-library/react"
import { SelectAnchor } from "../SelectAnchor"

// Mock hooks
const mockSetTarget = vi.fn()
const mockSelectionText = { current: "" }
const mockStartupMethod = { current: "textSelection" }
const mockDetectHold = { current: false }
// Stable like the real hook state, so the hold effect does not loop.
const mockHoldPosition = { x: 0, y: 0 }

vi.mock("@/hooks/useSelectContext", () => ({
  useSelectContext: () => ({
    setTarget: mockSetTarget,
    selectionText: mockSelectionText.current,
  }),
}))

vi.mock("@/hooks/useSettings", () => ({
  useUserSettings: () => ({
    userSettings: {
      startupMethod: {
        method: mockStartupMethod.current,
        leftClickHoldParam: 200,
      },
    },
    loading: false,
    error: null,
  }),
}))

vi.mock("@/hooks/useLeftClickHold", () => ({
  useLeftClickHold: () => ({
    detectHold: mockDetectHold.current,
    detectHoldLink: false,
    position: mockHoldPosition,
    progress: 0,
    linkElement: null,
  }),
}))

vi.mock("@/components/LinkClickGuard", () => ({
  LinkClickGuard: () => null,
}))

// Mock DOM functions
const mockGetSelectionText = vi.fn((): string => "")
const mockGetInputSelectionEndPoint = vi.fn(
  (_el: HTMLInputElement | HTMLTextAreaElement) =>
    null as { x: number; y: number } | null,
)
const mockGetEditableSelectionEndPoint = vi.fn(
  () => null as { x: number; y: number } | null,
)
const mockIsInputOrTextarea = vi.fn(
  (
    _target: EventTarget | null,
  ): _target is HTMLInputElement | HTMLTextAreaElement => false,
)
const mockIsEditable = vi.fn((_e: unknown): boolean => false)
const mockIsSelectionInDisabledArea = vi.fn((): boolean => false)

vi.mock("@/services/dom", () => ({
  getSelectionText: () => mockGetSelectionText(),
  isInputOrTextarea: (t: EventTarget | null) => mockIsInputOrTextarea(t),
  getInputSelectionEndPoint: (el: HTMLInputElement | HTMLTextAreaElement) =>
    mockGetInputSelectionEndPoint(el),
  getEditableSelectionEndPoint: () => mockGetEditableSelectionEndPoint(),
  isEditable: (e: unknown) => mockIsEditable(e),
  isSelectionInDisabledArea: () => mockIsSelectionInDisabledArea(),
}))

describe("SelectAnchor", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSelectionText.current = ""
    mockGetSelectionText.mockReturnValue("")
    mockIsInputOrTextarea.mockReturnValue(false as never)
    mockIsEditable.mockReturnValue(false)
    mockGetInputSelectionEndPoint.mockReturnValue(null)
    mockGetEditableSelectionEndPoint.mockReturnValue(null)
    mockIsSelectionInDisabledArea.mockReturnValue(false)
    mockStartupMethod.current = "textSelection"
    mockDetectHold.current = false
  })

  afterEach(() => {
    document.body.innerHTML = ""
  })

  it("SA-01: Shift+Arrow key in input triggers setAnchor", () => {
    const input = document.createElement("input")
    input.type = "text"
    input.value = "hello world"
    document.body.appendChild(input)
    input.focus()

    // Mock: activeElement is an input with selection
    mockIsInputOrTextarea.mockReturnValue(true as never)
    mockGetSelectionText.mockReturnValue("hello")
    mockGetInputSelectionEndPoint.mockReturnValue({ x: 50, y: 20 })

    render(<SelectAnchor />)

    // Simulate Shift+ArrowRight keyup
    act(() => {
      const event = new KeyboardEvent("keyup", {
        key: "ArrowRight",
        shiftKey: true,
        bubbles: true,
      })
      document.dispatchEvent(event)
    })

    expect(mockGetSelectionText).toHaveBeenCalled()
    expect(mockGetInputSelectionEndPoint).toHaveBeenCalled()
  })

  it("SA-02: Shift+Arrow key in contenteditable triggers setAnchor", () => {
    const div = document.createElement("div")
    div.contentEditable = "true"
    document.body.appendChild(div)
    div.focus()

    mockIsInputOrTextarea.mockReturnValue(false as never)
    mockIsEditable.mockReturnValue(true)
    mockGetSelectionText.mockReturnValue("selected text")
    mockGetEditableSelectionEndPoint.mockReturnValue({ x: 100, y: 30 })

    render(<SelectAnchor />)

    act(() => {
      const event = new KeyboardEvent("keyup", {
        key: "ArrowLeft",
        shiftKey: true,
        bubbles: true,
      })
      document.dispatchEvent(event)
    })

    expect(mockGetSelectionText).toHaveBeenCalled()
    expect(mockGetEditableSelectionEndPoint).toHaveBeenCalled()
  })

  it("SA-03: non-selection key in input does not trigger selection logic", () => {
    const input = document.createElement("input")
    input.type = "text"
    document.body.appendChild(input)
    input.focus()

    mockIsInputOrTextarea.mockReturnValue(true as never)
    mockIsEditable.mockReturnValue(false)

    render(<SelectAnchor />)

    // Simulate a regular key (no shift, not Ctrl+A)
    act(() => {
      const event = new KeyboardEvent("keyup", {
        key: "b",
        shiftKey: false,
        ctrlKey: false,
        metaKey: false,
        bubbles: true,
      })
      document.dispatchEvent(event)
    })

    // getSelectionText should NOT be called because:
    // - no shift key
    // - not Ctrl+A / Cmd+A
    // - not Meta/Control key
    // - point is null (no existing selection)
    expect(mockGetSelectionText).not.toHaveBeenCalled()
  })

  it("SA-04: Ctrl+A in input triggers selection logic", () => {
    const input = document.createElement("input")
    input.type = "text"
    input.value = "hello"
    document.body.appendChild(input)
    input.focus()

    mockIsInputOrTextarea.mockReturnValue(true as never)
    mockGetSelectionText.mockReturnValue("hello")
    mockGetInputSelectionEndPoint.mockReturnValue({ x: 80, y: 20 })

    render(<SelectAnchor />)

    act(() => {
      const event = new KeyboardEvent("keyup", {
        key: "a",
        ctrlKey: true,
        bubbles: true,
      })
      document.dispatchEvent(event)
    })

    expect(mockGetSelectionText).toHaveBeenCalled()
  })

  it("SA-05: keyup outside input/editable does not trigger input selection logic", () => {
    // activeElement is document.body (not input/editable)
    mockIsInputOrTextarea.mockReturnValue(false as never)
    mockIsEditable.mockReturnValue(false)

    render(<SelectAnchor />)

    act(() => {
      const event = new KeyboardEvent("keyup", {
        key: "ArrowRight",
        shiftKey: true,
        bubbles: true,
      })
      document.dispatchEvent(event)
    })

    // Should not call input/editable specific functions
    expect(mockGetInputSelectionEndPoint).not.toHaveBeenCalled()
    expect(mockGetEditableSelectionEndPoint).not.toHaveBeenCalled()
  })

  it("SA-06: renders nothing when point is null", () => {
    const { container } = render(<SelectAnchor />)
    // When no selection has been made, the component returns null
    expect(container.innerHTML).toBe("")
  })

  it("SA-07: double click on a selection shows the anchor", () => {
    mockGetSelectionText.mockReturnValue("hello")
    const { container } = render(<SelectAnchor />)

    act(() => {
      document.dispatchEvent(
        new MouseEvent("dblclick", { button: 0, bubbles: true }),
      )
    })

    expect(container.innerHTML).not.toBe("")
  })

  it("SA-08: selection inside a disabled area does not show the anchor", () => {
    mockGetSelectionText.mockReturnValue("hello")
    mockIsSelectionInDisabledArea.mockReturnValue(true)
    const { container } = render(<SelectAnchor />)

    act(() => {
      document.dispatchEvent(
        new MouseEvent("dblclick", { button: 0, bubbles: true }),
      )
    })

    expect(container.innerHTML).toBe("")
  })

  it("SA-09: selecting inside a disabled area removes an existing anchor", () => {
    mockGetSelectionText.mockReturnValue("hello")
    const { container } = render(<SelectAnchor />)

    act(() => {
      document.dispatchEvent(
        new MouseEvent("dblclick", { button: 0, bubbles: true }),
      )
    })
    expect(container.innerHTML).not.toBe("")

    mockIsSelectionInDisabledArea.mockReturnValue(true)
    act(() => {
      document.dispatchEvent(
        new MouseEvent("dblclick", { button: 0, bubbles: true }),
      )
    })
    expect(container.innerHTML).toBe("")
  })

  it("SA-10: context menu method keeps the anchor inside a disabled area", () => {
    // The anchor places the results of commands run from the context menu.
    mockStartupMethod.current = "contextMenu"
    mockGetSelectionText.mockReturnValue("hello")
    mockIsSelectionInDisabledArea.mockReturnValue(true)
    const { container } = render(<SelectAnchor />)

    act(() => {
      document.dispatchEvent(
        new MouseEvent("dblclick", { button: 0, bubbles: true }),
      )
    })

    expect(container.innerHTML).not.toBe("")
  })

  const dispatchSelectionChange = () => {
    act(() => {
      document.dispatchEvent(new Event("selectionchange"))
    })
  }

  it("SA-11: selection moved into a disabled area without mouse events removes the anchor", () => {
    // Anchor set by a selection outside the disabled area.
    mockGetSelectionText.mockReturnValue("outside")
    const { container } = render(<SelectAnchor />)
    act(() => {
      document.dispatchEvent(
        new MouseEvent("dblclick", { button: 0, bubbles: true }),
      )
    })
    expect(container.innerHTML).not.toBe("")

    // The page stops the mouse events in the area; only the selection changes.
    mockGetSelectionText.mockReturnValue("inside")
    mockIsSelectionInDisabledArea.mockReturnValue(true)
    dispatchSelectionChange()

    expect(container.innerHTML).toBe("")
  })

  it("SA-12: selection change outside a disabled area keeps the anchor", () => {
    mockGetSelectionText.mockReturnValue("outside")
    const { container } = render(<SelectAnchor />)
    act(() => {
      document.dispatchEvent(
        new MouseEvent("dblclick", { button: 0, bubbles: true }),
      )
    })

    mockGetSelectionText.mockReturnValue("outside 2")
    dispatchSelectionChange()

    expect(container.innerHTML).not.toBe("")
  })

  it("SA-13: context menu method keeps the anchor when the selection moves into a disabled area", () => {
    mockStartupMethod.current = "contextMenu"
    mockGetSelectionText.mockReturnValue("outside")
    const { container } = render(<SelectAnchor />)
    act(() => {
      document.dispatchEvent(
        new MouseEvent("dblclick", { button: 0, bubbles: true }),
      )
    })

    mockGetSelectionText.mockReturnValue("inside")
    mockIsSelectionInDisabledArea.mockReturnValue(true)
    dispatchSelectionChange()

    expect(container.innerHTML).not.toBe("")
  })

  it("SA-14: the same text selected again inside a disabled area removes the anchor", () => {
    // selectionText does not change, so only selectionchange can notice it.
    mockSelectionText.current = "demo"
    mockGetSelectionText.mockReturnValue("demo")
    const { container } = render(<SelectAnchor />)
    act(() => {
      document.dispatchEvent(
        new MouseEvent("dblclick", { button: 0, bubbles: true }),
      )
    })
    expect(container.innerHTML).not.toBe("")

    mockIsSelectionInDisabledArea.mockReturnValue(true)
    dispatchSelectionChange()

    expect(container.innerHTML).toBe("")
  })

  it("SA-15: a click hold does not swallow mouseup when the selection is in a disabled area", () => {
    mockStartupMethod.current = "leftClickHold"
    mockDetectHold.current = true
    mockGetSelectionText.mockReturnValue("inside")
    mockIsSelectionInDisabledArea.mockReturnValue(true)
    render(<SelectAnchor />)

    const e = new MouseEvent("mouseup", {
      button: 0,
      bubbles: true,
      cancelable: true,
    })
    act(() => {
      document.dispatchEvent(e)
    })

    expect(e.defaultPrevented).toBe(false)
  })

  it("SA-16: a click hold swallows mouseup outside a disabled area", () => {
    mockStartupMethod.current = "leftClickHold"
    mockDetectHold.current = true
    mockGetSelectionText.mockReturnValue("outside")
    render(<SelectAnchor />)

    const e = new MouseEvent("mouseup", {
      button: 0,
      bubbles: true,
      cancelable: true,
    })
    act(() => {
      document.dispatchEvent(e)
    })

    expect(e.defaultPrevented).toBe(true)
  })
})
