import { beforeEach, afterEach, describe, it, expect, vi } from "vitest"
import { SelectorType, PAGE_ACTION_EVENT } from "@/const"

// Mock dependencies
vi.mock("@/services/dom", () => ({
  getElementByXPath: vi.fn(),
  isValidXPath: vi.fn(),
}))

vi.mock("@/lib/utils", () => ({
  safeInterpolate: vi.fn(),
  isMac: vi.fn(),
  isEmpty: vi.fn(),
}))

vi.mock("@/services/pageAction", () => ({
  INSERT: {
    SELECTED_TEXT: "selectedText",
    URL: "url",
    CLIPBOARD: "clipboard",
  },
  InsertSymbol: {
    selectedText: "{{selectedText}}",
    url: "{{url}}",
    clipboard: "{{clipboard}}",
  },
}))

vi.mock("@/const", async () => {
  const actual = await vi.importActual("@/const")
  return {
    ...actual,
    PAGE_ACTION_TIMEOUT: 1000, // Reduce timeout for faster tests
  }
})

// Import modules after mocking
import { BackgroundPageActionDispatcher } from "./backgroundDispatcher"
import { getElementByXPath, isValidXPath } from "@/services/dom"
import { safeInterpolate, isMac, isEmpty } from "@/lib/utils"

// Get references to mocked functions
const mockGetElementByXPath = getElementByXPath as any
const mockIsValidXPath = isValidXPath as any
const mockSafeInterpolate = safeInterpolate as any
const mockIsMac = isMac as any
const mockIsEmpty = isEmpty as any

// Mock console methods
const mockConsole = {
  warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
}

// Mock DOM elements
const mockElements = {
  input: (() => {
    const input = document.createElement("input") as HTMLInputElement
    input.value = ""
    input.dispatchEvent = vi.fn()
    Object.defineProperty(input, "selectionStart", {
      writable: true,
      value: 0,
    })
    Object.defineProperty(input, "selectionEnd", {
      writable: true,
      value: 0,
    })
    return input
  })(),
  textarea: (() => {
    const textarea = document.createElement("textarea") as HTMLTextAreaElement
    textarea.value = ""
    textarea.dispatchEvent = vi.fn()
    Object.defineProperty(textarea, "selectionStart", {
      writable: true,
      value: 0,
    })
    Object.defineProperty(textarea, "selectionEnd", {
      writable: true,
      value: 0,
    })
    return textarea
  })(),
  div: (() => {
    const div = document.createElement("div")
    div.dispatchEvent = vi.fn()
    return div
  })(),
  contentEditableDiv: (() => {
    const div = document.createElement("div")
    div.contentEditable = "true"
    div.isContentEditable = true
    div.innerText = ""
    div.dispatchEvent = vi.fn()
    return div
  })(),
}

// Mock global objects
const mockDocument = {
  querySelector: vi.fn(),
  createRange: vi.fn(() => ({
    selectNodeContents: vi.fn(),
    collapse: vi.fn(),
  })),
}

const mockWindow = {
  scrollTo: vi.fn(),
  getSelection: vi.fn(() => ({
    removeAllRanges: vi.fn(),
    addRange: vi.fn(),
  })),
}

describe("backgroundDispatcher", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.clearAllMocks()
    mockConsole.warn.mockClear()

    // Reset mock implementations
    mockGetElementByXPath.mockReturnValue(null)
    mockIsValidXPath.mockReturnValue(true)
    mockSafeInterpolate.mockImplementation((str: string) => str)
    mockIsMac.mockReturnValue(false)
    mockIsEmpty.mockImplementation((str: string) => !str || str.length === 0)

    // Setup global mocks
    global.document = mockDocument as any
    global.window = mockWindow as any
    mockDocument.querySelector.mockReturnValue(null)

    // Reset element mocks
    mockElements.input.value = ""
    mockElements.textarea.value = ""
    mockElements.contentEditableDiv.innerText = ""
    mockElements.input.dispatchEvent = vi.fn()
    mockElements.textarea.dispatchEvent = vi.fn()
    mockElements.div.dispatchEvent = vi.fn()
    mockElements.contentEditableDiv.dispatchEvent = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("waitForElementBackground", () => {
    // We need to access the private function for testing
    // Since it's not exported, we'll test it through the public methods
    // But first let's create a helper to test the waiting logic

    it("WEB-01: Should find element with CSS selector immediately", async () => {
      const mockElement = mockElements.div
      mockDocument.querySelector.mockReturnValue(mockElement)

      const clickParam = {
        selector: ".test-button",
        selectorType: SelectorType.css,
        label: "Test Button",
      }

      const result = await BackgroundPageActionDispatcher.click(clickParam)

      expect(result).toEqual([true])
      expect(mockDocument.querySelector).toHaveBeenCalledWith(".test-button")
      expect(mockElement.dispatchEvent).toHaveBeenCalledTimes(1)
    })

    it("WEB-02: Should find element with XPath selector immediately", async () => {
      const mockElement = mockElements.div
      mockGetElementByXPath.mockReturnValue(mockElement)
      mockIsValidXPath.mockReturnValue(true)

      const clickParam = {
        selector: "//button[@class='test']",
        selectorType: SelectorType.xpath,
        label: "Test Button",
      }

      const result = await BackgroundPageActionDispatcher.click(clickParam)

      expect(result).toEqual([true])
      expect(mockIsValidXPath).toHaveBeenCalledWith("//button[@class='test']")
      expect(mockGetElementByXPath).toHaveBeenCalledWith(
        "//button[@class='test']",
      )
      expect(mockElement.dispatchEvent).toHaveBeenCalledTimes(1)
    })

    it("WEB-03: Should find element after multiple polling attempts", async () => {
      const mockElement = mockElements.div
      let callCount = 0
      mockDocument.querySelector.mockImplementation(() => {
        callCount++
        return callCount >= 3 ? mockElement : null
      })

      const clickParam = {
        selector: ".delayed-button",
        selectorType: SelectorType.css,
        label: "Delayed Button",
      }

      const resultPromise = BackgroundPageActionDispatcher.click(clickParam)

      // Advance time to trigger polling
      vi.advanceTimersByTime(300) // 3 polls * 100ms interval

      const result = await resultPromise

      expect(result).toEqual([true])
      expect(mockDocument.querySelector).toHaveBeenCalledTimes(3)
      expect(mockElement.dispatchEvent).toHaveBeenCalledTimes(1)
    })

    it("WEB-04: Should timeout when element is not found within timeout period", async () => {
      mockDocument.querySelector.mockReturnValue(null)

      const clickParam = {
        selector: ".nonexistent-button",
        selectorType: SelectorType.css,
        label: "Nonexistent Button",
      }

      const resultPromise = BackgroundPageActionDispatcher.click(clickParam)

      // Advance time beyond default timeout (PAGE_ACTION_TIMEOUT)
      vi.advanceTimersByTime(1100) // Advance beyond timeout (1000ms)

      const result = await resultPromise

      expect(result).toEqual([false, "Element not found: Nonexistent Button"])
      expect(mockConsole.warn).toHaveBeenCalledWith(
        "Element not found for: .nonexistent-button",
      )
    })

    it("WEB-05: Should handle invalid XPath gracefully", async () => {
      vi.useFakeTimers()
      mockIsValidXPath.mockReturnValue(false)

      const clickParam = {
        selector: "invalid-xpath",
        selectorType: SelectorType.xpath,
        label: "Invalid XPath",
      }

      const resultPromise = BackgroundPageActionDispatcher.click(clickParam)
      // Invalid XPath returns null immediately, but still needs to timeout in the polling loop
      vi.advanceTimersByTime(1100) // Skip timeout period

      const result = await resultPromise

      expect(result).toEqual([false, "Element not found: Invalid XPath"])
      expect(mockIsValidXPath).toHaveBeenCalledWith("invalid-xpath")
      expect(mockGetElementByXPath).not.toHaveBeenCalled()

      vi.useRealTimers()
    })

    it("WEB-06: Should handle empty selector string", async () => {
      const clickParam = {
        selector: "",
        selectorType: SelectorType.css,
        label: "Empty Selector",
      }

      const resultPromise = BackgroundPageActionDispatcher.click(clickParam)
      vi.advanceTimersByTime(1100) // Advance beyond timeout (1000ms)

      const result = await resultPromise

      expect(result).toEqual([false, "Element not found: Empty Selector"])
    })

    it("WEB-07: Should respect polling interval of 100ms", async () => {
      let callCount = 0
      const mockElement = mockElements.div
      mockDocument.querySelector.mockImplementation(() => {
        callCount++
        if (callCount <= 2) return null // Not found on immediate check and first poll
        return mockElement // Found on second poll
      })

      const clickParam = {
        selector: ".test",
        selectorType: SelectorType.css,
        label: "Test",
      }

      const resultPromise = BackgroundPageActionDispatcher.click(clickParam)

      // Immediate check happens first (callCount = 1)
      expect(callCount).toBe(1)

      vi.advanceTimersByTime(100) // First poll (callCount = 2)
      expect(callCount).toBe(2)

      vi.advanceTimersByTime(100) // Second poll - element found (callCount = 3)
      const result = await resultPromise
      expect(callCount).toBe(3)
      expect(result).toEqual([true])
    })

    it("WEB-08: Should clear interval when element is found", async () => {
      const mockElement = mockElements.div
      const clearIntervalSpy = vi.spyOn(global, "clearInterval")
      let callCount = 0

      // Element found after first poll (not on immediate check)
      mockDocument.querySelector.mockImplementation(() => {
        callCount++
        if (callCount === 1) return null // Not found on immediate check
        return mockElement // Found on first poll
      })

      const clickParam = {
        selector: ".found-on-poll",
        selectorType: SelectorType.css,
        label: "Found Button",
      }

      const resultPromise = BackgroundPageActionDispatcher.click(clickParam)

      // Immediate check (no element)
      expect(callCount).toBe(1)

      // First poll - element found, interval should be cleared
      vi.advanceTimersByTime(100)
      const result = await resultPromise

      expect(callCount).toBe(2)
      expect(clearIntervalSpy).toHaveBeenCalled()
      expect(result).toEqual([true])

      clearIntervalSpy.mockRestore()
    })
  })

  describe("BackgroundPageActionDispatcher.click", () => {
    it("BDC-01: Should execute click with CSS selector successfully", async () => {
      const mockElement = mockElements.div
      mockDocument.querySelector.mockReturnValue(mockElement)

      const param = {
        selector: ".click-button",
        selectorType: SelectorType.css,
        label: "Click Button",
      }

      const result = await BackgroundPageActionDispatcher.click(param)

      expect(result).toEqual([true])
      expect(mockDocument.querySelector).toHaveBeenCalledWith(".click-button")
      expect(mockElement.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "click",
          bubbles: true,
          cancelable: true,
          composed: true,
        }),
      )
    })

    it("BDC-02: Should execute click with XPath selector successfully", async () => {
      const mockElement = mockElements.div
      mockGetElementByXPath.mockReturnValue(mockElement)
      mockIsValidXPath.mockReturnValue(true)

      const param = {
        selector: "//button[@id='click-btn']",
        selectorType: SelectorType.xpath,
        label: "Click Button XPath",
      }

      const result = await BackgroundPageActionDispatcher.click(param)

      expect(result).toEqual([true])
      expect(mockIsValidXPath).toHaveBeenCalledWith("//button[@id='click-btn']")
      expect(mockGetElementByXPath).toHaveBeenCalledWith(
        "//button[@id='click-btn']",
      )
      expect(mockElement.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "click",
          bubbles: true,
          cancelable: true,
          composed: true,
        }),
      )
    })

    it("BDC-03: Should create MouseEvent with correct properties", async () => {
      const mockElement = mockElements.div
      mockDocument.querySelector.mockReturnValue(mockElement)

      const param = {
        selector: ".test",
        selectorType: SelectorType.css,
        label: "Test",
      }

      await BackgroundPageActionDispatcher.click(param)

      expect(mockElement.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "click",
          bubbles: true,
          cancelable: true,
          composed: true,
        }),
      )
    })

    it("BDC-04: Should return error when element not found", async () => {
      mockDocument.querySelector.mockReturnValue(null)

      const param = {
        selector: ".not-found",
        selectorType: SelectorType.css,
        label: "Not Found Button",
      }

      const resultPromise = BackgroundPageActionDispatcher.click(param)
      vi.advanceTimersByTime(1100) // Advance beyond timeout (1000ms)

      const result = await resultPromise

      expect(result).toEqual([false, "Element not found: Not Found Button"])
      expect(mockConsole.warn).toHaveBeenCalledWith(
        "Element not found for: .not-found",
      )
    })
  })

  describe("BackgroundPageActionDispatcher.doubleClick", () => {
    it("BDD-01: Should execute double click successfully", async () => {
      const mockElement = mockElements.div
      mockDocument.querySelector.mockReturnValue(mockElement)

      const param = {
        selector: ".double-click-button",
        selectorType: SelectorType.css,
        label: "Double Click Button",
      }

      const result = await BackgroundPageActionDispatcher.doubleClick(param)

      expect(result).toEqual([true])
      expect(mockElement.dispatchEvent).toHaveBeenCalledTimes(2)
    })

    it("BDD-02: Should dispatch click then dblclick events in order", async () => {
      const mockElement = mockElements.div
      const dispatchedEvents: string[] = []
      mockElement.dispatchEvent = vi.fn().mockImplementation((event) => {
        dispatchedEvents.push(event.type)
      })
      mockDocument.querySelector.mockReturnValue(mockElement)

      const param = {
        selector: ".test",
        selectorType: SelectorType.css,
        label: "Test",
      }

      await BackgroundPageActionDispatcher.doubleClick(param)

      expect(dispatchedEvents).toEqual(["click", "dblclick"])
    })

    it("BDD-03: Should set correct detail properties", async () => {
      const mockElement = mockElements.div
      const eventDetails: number[] = []
      mockElement.dispatchEvent = vi.fn().mockImplementation((event) => {
        eventDetails.push(event.detail)
      })
      mockDocument.querySelector.mockReturnValue(mockElement)

      const param = {
        selector: ".test",
        selectorType: SelectorType.css,
        label: "Test",
      }

      await BackgroundPageActionDispatcher.doubleClick(param)

      expect(eventDetails).toEqual([1, 2])
    })

    it("BDD-04: Should return error when element not found", async () => {
      mockDocument.querySelector.mockReturnValue(null)

      const param = {
        selector: ".not-found",
        selectorType: SelectorType.css,
        label: "Not Found",
      }

      const resultPromise = BackgroundPageActionDispatcher.doubleClick(param)
      vi.advanceTimersByTime(1100) // Advance beyond timeout (1000ms)

      const result = await resultPromise

      expect(result).toEqual([false, "Element not found: Not Found"])
      expect(mockConsole.warn).toHaveBeenCalledWith(
        "Element not found for: .not-found",
      )
    })
  })

  describe("BackgroundPageActionDispatcher.tripleClick", () => {
    it("BDT-01: Should execute triple click successfully", async () => {
      const mockElement = mockElements.div
      mockDocument.querySelector.mockReturnValue(mockElement)

      const param = {
        selector: ".triple-click-button",
        selectorType: SelectorType.css,
        label: "Triple Click Button",
      }

      const result = await BackgroundPageActionDispatcher.tripleClick(param)

      expect(result).toEqual([true])
      expect(mockElement.dispatchEvent).toHaveBeenCalledTimes(3)
    })

    it("BDT-02: Should dispatch three click events in order", async () => {
      const mockElement = mockElements.div
      const dispatchedEvents: string[] = []
      mockElement.dispatchEvent = vi.fn().mockImplementation((event) => {
        dispatchedEvents.push(event.type)
      })
      mockDocument.querySelector.mockReturnValue(mockElement)

      const param = {
        selector: ".test",
        selectorType: SelectorType.css,
        label: "Test",
      }

      await BackgroundPageActionDispatcher.tripleClick(param)

      expect(dispatchedEvents).toEqual(["click", "click", "click"])
    })

    it("BDT-03: Should set correct detail properties in sequence", async () => {
      const mockElement = mockElements.div
      const eventDetails: number[] = []
      mockElement.dispatchEvent = vi.fn().mockImplementation((event) => {
        eventDetails.push(event.detail)
      })
      mockDocument.querySelector.mockReturnValue(mockElement)

      const param = {
        selector: ".test",
        selectorType: SelectorType.css,
        label: "Test",
      }

      await BackgroundPageActionDispatcher.tripleClick(param)

      expect(eventDetails).toEqual([1, 2, 3])
    })

    it("BDT-04: Should return error when element not found", async () => {
      mockDocument.querySelector.mockReturnValue(null)

      const param = {
        selector: ".not-found",
        selectorType: SelectorType.css,
        label: "Not Found",
      }

      const resultPromise = BackgroundPageActionDispatcher.tripleClick(param)
      vi.advanceTimersByTime(1100) // Advance beyond timeout (1000ms)

      const result = await resultPromise

      expect(result).toEqual([false, "Element not found: Not Found"])
      expect(mockConsole.warn).toHaveBeenCalledWith(
        "Element not found for: .not-found",
      )
    })
  })

  describe("BackgroundPageActionDispatcher.keyboard", () => {
    it("BDK-01: Should execute basic keyboard event successfully", async () => {
      const mockElement = mockElements.div
      mockDocument.querySelector.mockReturnValue(mockElement)

      const param = {
        targetSelector: ".input-field",
        selectorType: SelectorType.css,
        label: "Input Field",
        key: "Enter",
        code: "Enter",
        keyCode: 13,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        altKey: false,
      }

      const result = await BackgroundPageActionDispatcher.keyboard(param)

      expect(result).toEqual([true])
      expect(mockElement.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "keydown",
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          bubbles: true,
          cancelable: true,
        }),
      )
    })

    it("BDK-02: Should convert Ctrl to Meta on Mac", async () => {
      mockIsMac.mockReturnValue(true)
      const mockElement = mockElements.div
      mockDocument.querySelector.mockReturnValue(mockElement)

      const param = {
        targetSelector: ".input-field",
        selectorType: SelectorType.css,
        label: "Input Field",
        key: "c",
        code: "KeyC",
        keyCode: 67,
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        altKey: false,
      }

      const result = await BackgroundPageActionDispatcher.keyboard(param)

      expect(result).toEqual([true])
      expect(mockElement.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          ctrlKey: false,
          metaKey: true,
        }),
      )
    })

    it("BDK-03: Should convert Meta to Ctrl on Windows", async () => {
      mockIsMac.mockReturnValue(false)
      const mockElement = mockElements.div
      mockDocument.querySelector.mockReturnValue(mockElement)

      const param = {
        targetSelector: ".input-field",
        selectorType: SelectorType.css,
        label: "Input Field",
        key: "c",
        code: "KeyC",
        keyCode: 67,
        ctrlKey: false,
        metaKey: true,
        shiftKey: false,
        altKey: false,
      }

      const result = await BackgroundPageActionDispatcher.keyboard(param)

      expect(result).toEqual([true])
      expect(mockElement.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          ctrlKey: true,
          metaKey: false,
        }),
      )
    })

    it("BDK-04: Should handle keyboard event without modifier keys", async () => {
      const mockElement = mockElements.div
      mockDocument.querySelector.mockReturnValue(mockElement)

      const param = {
        targetSelector: ".input-field",
        selectorType: SelectorType.css,
        label: "Input Field",
        key: "a",
        code: "KeyA",
        keyCode: 65,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        altKey: false,
      }

      const result = await BackgroundPageActionDispatcher.keyboard(param)

      expect(result).toEqual([true])
      expect(mockElement.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          key: "a",
          code: "KeyA",
          keyCode: 65,
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          altKey: false,
        }),
      )
    })

    it("BDK-05: Should verify KeyboardEvent properties are correct", async () => {
      const mockElement = mockElements.div
      mockDocument.querySelector.mockReturnValue(mockElement)

      const param = {
        targetSelector: ".test",
        selectorType: SelectorType.css,
        label: "Test",
        key: "Tab",
        code: "Tab",
        keyCode: 9,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        altKey: false,
      }

      await BackgroundPageActionDispatcher.keyboard(param)

      expect(mockElement.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "keydown",
          bubbles: true,
          cancelable: true,
        }),
      )
    })

    it("BDK-06: Should return error when element not found", async () => {
      mockDocument.querySelector.mockReturnValue(null)

      const param = {
        targetSelector: ".not-found",
        selectorType: SelectorType.css,
        label: "Not Found",
        key: "Enter",
        code: "Enter",
        keyCode: 13,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        altKey: false,
      }

      const resultPromise = BackgroundPageActionDispatcher.keyboard(param)
      vi.advanceTimersByTime(1100) // Advance beyond timeout (1000ms)

      const result = await resultPromise

      expect(result).toEqual([false, "Element not found: Not Found"])
      expect(mockConsole.warn).toHaveBeenCalledWith(
        "Element not found for: .not-found",
      )
    })
  })

  describe("BackgroundPageActionDispatcher.input", () => {
    it("BDI-01: Should input text into HTMLInputElement", async () => {
      const mockElement = mockElements.input
      mockElement.value = "existing"
      mockDocument.querySelector.mockReturnValue(mockElement)

      const param = {
        selector: ".input-field",
        selectorType: SelectorType.css,
        label: "Input Field",
        value: "test text",
        srcUrl: "",
        selectedText: "",
        clipboardText: "",
      }

      const result = await BackgroundPageActionDispatcher.input(param)

      expect(result).toEqual([true])
      expect(mockElement.value).toBe("existingtest text")
      expect(mockElement.selectionStart).toBe(17) // Length of combined text
      expect(mockElement.selectionEnd).toBe(17)
      expect(mockElement.dispatchEvent).toHaveBeenCalledTimes(2) // input and change events
    })

    it("BDI-02: Should input text into HTMLTextAreaElement", async () => {
      const mockElement = mockElements.textarea
      mockElement.value = "existing"
      mockDocument.querySelector.mockReturnValue(mockElement)

      const param = {
        selector: ".textarea-field",
        selectorType: SelectorType.css,
        label: "Textarea Field",
        value: "test text",
        srcUrl: "",
        selectedText: "",
        clipboardText: "",
      }

      const result = await BackgroundPageActionDispatcher.input(param)

      expect(result).toEqual([true])
      expect(mockElement.value).toBe("existingtest text")
      expect(mockElement.selectionStart).toBe(17)
      expect(mockElement.selectionEnd).toBe(17)
      expect(mockElement.dispatchEvent).toHaveBeenCalledTimes(2)
    })

    it("BDI-03: Should input text into ContentEditable element", async () => {
      const mockElement = mockElements.contentEditableDiv
      mockElement.innerText = "existing"
      mockDocument.querySelector.mockReturnValue(mockElement)

      const mockRange = {
        selectNodeContents: vi.fn(),
        collapse: vi.fn(),
      }
      const mockSelection = {
        removeAllRanges: vi.fn(),
        addRange: vi.fn(),
      }
      mockDocument.createRange.mockReturnValue(mockRange)
      mockWindow.getSelection.mockReturnValue(mockSelection)

      const param = {
        selector: ".contenteditable",
        selectorType: SelectorType.css,
        label: "ContentEditable",
        value: "test text",
        srcUrl: "",
        selectedText: "",
        clipboardText: "",
      }

      const result = await BackgroundPageActionDispatcher.input(param)

      expect(result).toEqual([true])
      expect(mockElement.innerText).toBe("existingtest text")
      expect(mockRange.selectNodeContents).toHaveBeenCalledWith(mockElement)
      expect(mockRange.collapse).toHaveBeenCalledWith(false)
      expect(mockSelection.removeAllRanges).toHaveBeenCalled()
      expect(mockSelection.addRange).toHaveBeenCalledWith(mockRange)
      expect(mockElement.dispatchEvent).toHaveBeenCalledTimes(1) // input event
    })

    it("BDI-04: Should replace selectedText variable", async () => {
      const mockElement = mockElements.input
      mockElement.value = ""
      mockDocument.querySelector.mockReturnValue(mockElement)
      mockSafeInterpolate.mockImplementation((template, vars) => {
        return template.replace("{{selectedText}}", vars["{{selectedText}}"])
      })

      const param = {
        selector: ".input",
        selectorType: SelectorType.css,
        label: "Input",
        value: "Selected: {{selectedText}}",
        srcUrl: "",
        selectedText: "hello world",
        clipboardText: "",
      }

      const result = await BackgroundPageActionDispatcher.input(param)

      expect(result).toEqual([true])
      expect(mockSafeInterpolate).toHaveBeenCalledWith(
        "Selected: {{selectedText}}",
        expect.objectContaining({
          "{{selectedText}}": "hello world",
        }),
      )
    })

    it("BDI-05: Should replace URL variable", async () => {
      const mockElement = mockElements.input
      mockElement.value = ""
      mockDocument.querySelector.mockReturnValue(mockElement)
      mockSafeInterpolate.mockImplementation((template, vars) => {
        return template.replace("{{url}}", vars["{{url}}"])
      })

      const param = {
        selector: ".input",
        selectorType: SelectorType.css,
        label: "Input",
        value: "URL: {{url}}",
        srcUrl: "https://example.com",
        selectedText: "",
        clipboardText: "",
      }

      const result = await BackgroundPageActionDispatcher.input(param)

      expect(result).toEqual([true])
      expect(mockSafeInterpolate).toHaveBeenCalledWith(
        "URL: {{url}}",
        expect.objectContaining({
          "{{url}}": "https://example.com",
        }),
      )
    })

    it("BDI-06: Should replace clipboard variable", async () => {
      const mockElement = mockElements.input
      mockElement.value = ""
      mockDocument.querySelector.mockReturnValue(mockElement)
      mockSafeInterpolate.mockImplementation((template, vars) => {
        return template.replace("{{clipboard}}", vars["{{clipboard}}"])
      })

      const param = {
        selector: ".input",
        selectorType: SelectorType.css,
        label: "Input",
        value: "Clipboard: {{clipboard}}",
        srcUrl: "",
        selectedText: "",
        clipboardText: "copied text",
      }

      const result = await BackgroundPageActionDispatcher.input(param)

      expect(result).toEqual([true])
      expect(mockSafeInterpolate).toHaveBeenCalledWith(
        "Clipboard: {{clipboard}}",
        expect.objectContaining({
          "{{clipboard}}": "copied text",
        }),
      )
    })

    it("BDI-07: Should replace multiple variables", async () => {
      const mockElement = mockElements.input
      mockElement.value = ""
      mockDocument.querySelector.mockReturnValue(mockElement)
      mockSafeInterpolate.mockImplementation((template, vars) => {
        let result = template
        Object.entries(vars).forEach(([key, value]) => {
          result = result.replace(key, value as string)
        })
        return result
      })

      const param = {
        selector: ".input",
        selectorType: SelectorType.css,
        label: "Input",
        value: "{{selectedText}} from {{url}} in {{clipboard}}",
        srcUrl: "https://example.com",
        selectedText: "hello",
        clipboardText: "clipboard",
      }

      const result = await BackgroundPageActionDispatcher.input(param)

      expect(result).toEqual([true])
      expect(mockSafeInterpolate).toHaveBeenCalledWith(
        "{{selectedText}} from {{url}} in {{clipboard}}",
        expect.objectContaining({
          "{{selectedText}}": "hello",
          "{{url}}": "https://example.com",
          "{{clipboard}}": "clipboard",
        }),
      )
    })

    it("BDI-08: Should handle brace escaping", async () => {
      const mockElement = mockElements.input
      mockElement.value = ""
      mockDocument.querySelector.mockReturnValue(mockElement)
      mockSafeInterpolate.mockReturnValue("test {value}")

      const param = {
        selector: ".input",
        selectorType: SelectorType.css,
        label: "Input",
        value: "test {value}",
        srcUrl: "",
        selectedText: "",
        clipboardText: "",
      }

      await BackgroundPageActionDispatcher.input(param)

      // The value should be escaped after interpolation
      expect(mockElement.value).toContain("test {{value}")
    })

    it("BDI-09: Should append to existing value", async () => {
      const mockElement = mockElements.input
      mockElement.value = "existing text"
      mockDocument.querySelector.mockReturnValue(mockElement)

      const param = {
        selector: ".input",
        selectorType: SelectorType.css,
        label: "Input",
        value: " appended",
        srcUrl: "",
        selectedText: "",
        clipboardText: "",
      }

      const result = await BackgroundPageActionDispatcher.input(param)

      expect(result).toEqual([true])
      expect(mockElement.value).toBe("existing text appended")
    })

    it("BDI-10: Should set cursor position correctly", async () => {
      const mockElement = mockElements.input
      mockElement.value = "existing"
      mockDocument.querySelector.mockReturnValue(mockElement)

      const param = {
        selector: ".input",
        selectorType: SelectorType.css,
        label: "Input",
        value: " text",
        srcUrl: "",
        selectedText: "",
        clipboardText: "",
      }

      await BackgroundPageActionDispatcher.input(param)

      const expectedLength = "existing text".length
      expect(mockElement.selectionStart).toBe(expectedLength)
      expect(mockElement.selectionEnd).toBe(expectedLength)
    })

    it("BDI-11: Should dispatch input and change events", async () => {
      const mockElement = mockElements.input
      mockElement.value = ""
      mockDocument.querySelector.mockReturnValue(mockElement)

      const eventTypes: string[] = []
      mockElement.dispatchEvent = vi.fn().mockImplementation((event) => {
        eventTypes.push(event.type)
      })

      const param = {
        selector: ".input",
        selectorType: SelectorType.css,
        label: "Input",
        value: "test",
        srcUrl: "",
        selectedText: "",
        clipboardText: "",
      }

      await BackgroundPageActionDispatcher.input(param)

      expect(eventTypes).toEqual(["input", "change"])
      expect(mockElement.dispatchEvent).toHaveBeenCalledTimes(2)
    })

    it("BDI-12: Should skip processing when value is empty", async () => {
      const mockElement = mockElements.input
      mockElement.value = "existing"
      mockDocument.querySelector.mockReturnValue(mockElement)
      mockIsEmpty.mockReturnValue(true)

      const param = {
        selector: ".input",
        selectorType: SelectorType.css,
        label: "Input",
        value: "",
        srcUrl: "",
        selectedText: "",
        clipboardText: "",
      }

      const result = await BackgroundPageActionDispatcher.input(param)

      expect(result).toEqual([true])
      expect(mockElement.value).toBe("existing") // Should remain unchanged
      expect(mockElement.dispatchEvent).not.toHaveBeenCalled()
    })

    it("BDI-13: Should return error when element not found", async () => {
      mockDocument.querySelector.mockReturnValue(null)

      const param = {
        selector: ".not-found",
        selectorType: SelectorType.css,
        label: "Not Found",
        value: "test",
        srcUrl: "",
        selectedText: "",
        clipboardText: "",
      }

      const resultPromise = BackgroundPageActionDispatcher.input(param)
      vi.advanceTimersByTime(1100) // Advance beyond timeout (1000ms)

      const result = await resultPromise

      expect(result).toEqual([false, "Element not found: Not Found"])
      expect(mockConsole.warn).toHaveBeenCalledWith(
        "Element not found for: .not-found",
      )
    })
  })

  describe("BackgroundPageActionDispatcher.scroll", () => {
    it("BDS-01: Should execute scroll successfully", async () => {
      const param = {
        x: 100,
        y: 200,
        label: "Scroll",
      }

      const result = await BackgroundPageActionDispatcher.scroll(param)

      expect(result).toEqual([true])
      expect(mockWindow.scrollTo).toHaveBeenCalledWith({
        top: 200,
        left: 100,
      })
    })

    it("BDS-02: Should scroll to origin (0,0)", async () => {
      const param = {
        x: 0,
        y: 0,
        label: "Scroll to top",
      }

      const result = await BackgroundPageActionDispatcher.scroll(param)

      expect(result).toEqual([true])
      expect(mockWindow.scrollTo).toHaveBeenCalledWith({
        top: 0,
        left: 0,
      })
    })

    it("BDS-03: Should handle large coordinate values", async () => {
      const param = {
        x: 10000,
        y: 20000,
        label: "Large scroll",
      }

      const result = await BackgroundPageActionDispatcher.scroll(param)

      expect(result).toEqual([true])
      expect(mockWindow.scrollTo).toHaveBeenCalledWith({
        top: 20000,
        left: 10000,
      })
    })

    it("BDS-05: Should handle negative coordinate values", async () => {
      const param = {
        x: -100,
        y: -200,
        label: "Negative scroll",
      }

      const result = await BackgroundPageActionDispatcher.scroll(param)

      expect(result).toEqual([true])
      expect(mockWindow.scrollTo).toHaveBeenCalledWith({
        top: -200,
        left: -100,
      })
    })
  })
})
