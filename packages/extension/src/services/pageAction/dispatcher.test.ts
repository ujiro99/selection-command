import { beforeEach, afterEach, describe, it, expect, vi } from "vitest"
import { SelectorType, PAGE_ACTION_EVENT } from "@/const"

// Mock dependencies
vi.mock("@/services/dom", () => ({
  getElementByXPath: vi.fn(),
  isValidXPath: vi.fn(),
  isEditable: vi.fn(),
  inputContentEditable: vi.fn(),
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
    LANG: "lang",
  },
  InsertSymbol: {
    selectedText: "{{selectedText}}",
    url: "{{url}}",
    clipboard: "{{clipboard}}",
    lang: "{{lang}}",
  },
}))

vi.mock("@/services/i18n", () => ({
  getUILanguage: vi.fn(() => "en"),
}))

vi.mock("@testing-library/user-event", () => ({
  default: {
    setup: vi.fn(),
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
import { PageActionDispatcher } from "./dispatcher"
import {
  getElementByXPath,
  isValidXPath,
  isEditable,
  inputContentEditable,
} from "@/services/dom"
import { safeInterpolate, isMac, isEmpty } from "@/lib/utils"
import { getUILanguage } from "@/services/i18n"
import userEvent from "@testing-library/user-event"

// Get references to mocked functions
const mockGetElementByXPath = getElementByXPath as any
const mockIsValidXPath = isValidXPath as any
const mockIsEditable = isEditable as any
const mockInputContentEditable = inputContentEditable as any
const mockSafeInterpolate = safeInterpolate as any
const mockIsMac = isMac as any
const mockIsEmpty = isEmpty as any
const mockGetUILanguage = getUILanguage as any
const mockUserEventSetup = (userEvent as any).setup as ReturnType<typeof vi.fn>

// Mock console methods
const mockConsole = {
  warn: vi.spyOn(console, "warn").mockImplementation(() => { }),
}

// Mock DOM elements
const mockElements = {
  input: (() => {
    const input = document.createElement("input") as HTMLInputElement
    input.value = ""
    input.focus = vi.fn()
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
  div: (() => {
    const div = document.createElement("div")
    div.dispatchEvent = vi.fn()
    return div
  })(),
  contentEditableDiv: (() => {
    const div = document.createElement("div")
    div.contentEditable = "true"
    Object.defineProperty(div, "isContentEditable", {
      value: true,
      writable: true,
    })
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
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  getSelection: vi.fn(() => ({
    removeAllRanges: vi.fn(),
    addRange: vi.fn(),
  })),
}

// userEvent mock instance returned by setup()
let mockUserInstance: {
  type: ReturnType<typeof vi.fn>
  click: ReturnType<typeof vi.fn>
  dblClick: ReturnType<typeof vi.fn>
  tripleClick: ReturnType<typeof vi.fn>
}

describe("PageActionDispatcher", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.clearAllMocks()
    mockConsole.warn.mockClear()

    // Setup userEvent mock instance
    mockUserInstance = {
      type: vi.fn(),
      click: vi.fn(),
      dblClick: vi.fn(),
      tripleClick: vi.fn(),
    }
    mockUserEventSetup.mockReturnValue(mockUserInstance)

    // Reset mock implementations
    mockGetElementByXPath.mockReturnValue(null)
    mockIsValidXPath.mockReturnValue(true)
    mockIsEditable.mockReturnValue(false)
    mockSafeInterpolate.mockImplementation((str: string) => str)
    mockIsMac.mockReturnValue(false)
    mockIsEmpty.mockImplementation((str: string) => !str || str.length === 0)
    mockGetUILanguage.mockReturnValue("en")

    // Setup global mocks
    global.document = mockDocument as any
    global.window = mockWindow as any
    mockDocument.querySelector.mockReturnValue(null)

    // Reset element mocks
    mockElements.input.value = ""
    mockElements.contentEditableDiv.innerText = ""
    mockElements.input.dispatchEvent = vi.fn()
    mockElements.div.dispatchEvent = vi.fn()
    mockElements.contentEditableDiv.dispatchEvent = vi.fn()
    mockElements.input.focus = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("PageActionDispatcher.click", () => {
    it("PDC-01: Should execute click with CSS selector successfully", async () => {
      const mockElement = mockElements.div
      mockDocument.querySelector.mockReturnValue(mockElement)

      const param = {
        type: PAGE_ACTION_EVENT.click,
        selector: ".click-button",
        selectorType: SelectorType.css,
        label: "Click Button",
      }

      const result = await PageActionDispatcher.click(param as any)

      expect(result).toEqual([true])
      expect(mockUserInstance.click).toHaveBeenCalledWith(mockElement)
    })

    it("PDC-02: Should return error when element not found", async () => {
      mockDocument.querySelector.mockReturnValue(null)

      const param = {
        type: PAGE_ACTION_EVENT.click,
        selector: ".not-found",
        selectorType: SelectorType.css,
        label: "Not Found Button",
      }

      const resultPromise = PageActionDispatcher.click(param as any)
      vi.advanceTimersByTime(1100)

      const result = await resultPromise

      expect(result).toEqual([false, "Element not found: Not Found Button"])
      expect(mockConsole.warn).toHaveBeenCalledWith(
        "Element not found for: .not-found",
      )
    })

    it("PDC-03: Should find element with XPath selector", async () => {
      const mockElement = mockElements.div
      mockGetElementByXPath.mockReturnValue(mockElement)
      mockIsValidXPath.mockReturnValue(true)

      const param = {
        type: PAGE_ACTION_EVENT.click,
        selector: "//button[@id='test']",
        selectorType: SelectorType.xpath,
        label: "XPath Button",
      }

      const result = await PageActionDispatcher.click(param as any)

      expect(result).toEqual([true])
      expect(mockIsValidXPath).toHaveBeenCalledWith("//button[@id='test']")
      expect(mockGetElementByXPath).toHaveBeenCalledWith("//button[@id='test']")
    })
  })

  describe("PageActionDispatcher.input", () => {
    it("PDI-01: Should input text into a non-editable element via userEvent.type", async () => {
      const mockElement = mockElements.input
      mockDocument.querySelector.mockReturnValue(mockElement)
      mockIsEditable.mockReturnValue(false)

      const param = {
        type: PAGE_ACTION_EVENT.input,
        selector: ".input-field",
        selectorType: SelectorType.css,
        label: "Input Field",
        value: "hello",
        srcUrl: "",
        selectedText: "",
        clipboardText: "",
      }

      const result = await PageActionDispatcher.input(param as any)

      expect(result).toEqual([true])
      expect(mockUserInstance.type).toHaveBeenCalledWith(
        mockElement,
        expect.any(String),
        { skipClick: true },
      )
    })

    it("PDI-02: Should input text into a contenteditable element via inputContentEditable", async () => {
      const mockElement = mockElements.contentEditableDiv
      mockDocument.querySelector.mockReturnValue(mockElement)
      mockIsEditable.mockReturnValue(true)
      mockInputContentEditable.mockResolvedValue(undefined)

      const param = {
        type: PAGE_ACTION_EVENT.input,
        selector: ".contenteditable",
        selectorType: SelectorType.css,
        label: "ContentEditable",
        value: "test text",
        srcUrl: "",
        selectedText: "",
        clipboardText: "",
      }

      const result = await PageActionDispatcher.input(param as any)

      expect(result).toEqual([true])
      expect(mockInputContentEditable).toHaveBeenCalledWith(
        mockElement,
        "test text",
        40,
        null,
      )
    })

    it("PDI-03: Should include lang variable in the variable map", async () => {
      const mockElement = mockElements.input
      mockDocument.querySelector.mockReturnValue(mockElement)
      mockIsEditable.mockReturnValue(false)
      mockGetUILanguage.mockReturnValue("ja")

      const param = {
        type: PAGE_ACTION_EVENT.input,
        selector: ".input",
        selectorType: SelectorType.css,
        label: "Input",
        value: "{{lang}}",
        srcUrl: "",
        selectedText: "",
        clipboardText: "",
      }

      await PageActionDispatcher.input(param as any)

      expect(mockSafeInterpolate).toHaveBeenCalledWith(
        "{{lang}}",
        expect.objectContaining({
          "{{lang}}": "ja",
        }),
      )
    })

    it("PDI-04: Should pass all variables to safeInterpolate including lang", async () => {
      const mockElement = mockElements.input
      mockDocument.querySelector.mockReturnValue(mockElement)
      mockIsEditable.mockReturnValue(false)
      mockGetUILanguage.mockReturnValue("fr")

      const param = {
        type: PAGE_ACTION_EVENT.input,
        selector: ".input",
        selectorType: SelectorType.css,
        label: "Input",
        value: "{{selectedText}} {{url}} {{clipboard}} {{lang}}",
        srcUrl: "https://example.com",
        selectedText: "hello",
        clipboardText: "copied",
      }

      await PageActionDispatcher.input(param as any)

      expect(mockSafeInterpolate).toHaveBeenCalledWith(
        "{{selectedText}} {{url}} {{clipboard}} {{lang}}",
        expect.objectContaining({
          "{{selectedText}}": "hello",
          "{{url}}": "https://example.com",
          "{{clipboard}}": "copied",
          "{{lang}}": "fr",
        }),
      )
    })

    it("PDI-05: Should use different lang values based on getUILanguage result", async () => {
      const mockElement = mockElements.input
      mockDocument.querySelector.mockReturnValue(mockElement)
      mockIsEditable.mockReturnValue(false)
      mockGetUILanguage.mockReturnValue("zh-CN")

      const param = {
        type: PAGE_ACTION_EVENT.input,
        selector: ".input",
        selectorType: SelectorType.css,
        label: "Input",
        value: "Reply in {{lang}}",
        srcUrl: "",
        selectedText: "",
        clipboardText: "",
      }

      await PageActionDispatcher.input(param as any)

      expect(mockSafeInterpolate).toHaveBeenCalledWith(
        "Reply in {{lang}}",
        expect.objectContaining({
          "{{lang}}": "zh-CN",
        }),
      )
    })

    it("PDI-06: Should replace selectedText variable", async () => {
      const mockElement = mockElements.input
      mockDocument.querySelector.mockReturnValue(mockElement)
      mockIsEditable.mockReturnValue(false)

      const param = {
        type: PAGE_ACTION_EVENT.input,
        selector: ".input",
        selectorType: SelectorType.css,
        label: "Input",
        value: "Selected: {{selectedText}}",
        srcUrl: "",
        selectedText: "hello world",
        clipboardText: "",
      }

      await PageActionDispatcher.input(param as any)

      expect(mockSafeInterpolate).toHaveBeenCalledWith(
        "Selected: {{selectedText}}",
        expect.objectContaining({
          "{{selectedText}}": "hello world",
        }),
      )
    })

    it("PDI-07: Should replace URL variable", async () => {
      const mockElement = mockElements.input
      mockDocument.querySelector.mockReturnValue(mockElement)
      mockIsEditable.mockReturnValue(false)

      const param = {
        type: PAGE_ACTION_EVENT.input,
        selector: ".input",
        selectorType: SelectorType.css,
        label: "Input",
        value: "URL: {{url}}",
        srcUrl: "https://example.com",
        selectedText: "",
        clipboardText: "",
      }

      await PageActionDispatcher.input(param as any)

      expect(mockSafeInterpolate).toHaveBeenCalledWith(
        "URL: {{url}}",
        expect.objectContaining({
          "{{url}}": "https://example.com",
        }),
      )
    })

    it("PDI-08: Should replace clipboard variable", async () => {
      const mockElement = mockElements.input
      mockDocument.querySelector.mockReturnValue(mockElement)
      mockIsEditable.mockReturnValue(false)

      const param = {
        type: PAGE_ACTION_EVENT.input,
        selector: ".input",
        selectorType: SelectorType.css,
        label: "Input",
        value: "Clipboard: {{clipboard}}",
        srcUrl: "",
        selectedText: "",
        clipboardText: "copied text",
      }

      await PageActionDispatcher.input(param as any)

      expect(mockSafeInterpolate).toHaveBeenCalledWith(
        "Clipboard: {{clipboard}}",
        expect.objectContaining({
          "{{clipboard}}": "copied text",
        }),
      )
    })

    it("PDI-09: Should skip processing when value is empty", async () => {
      const mockElement = mockElements.input
      mockElement.value = "existing"
      mockDocument.querySelector.mockReturnValue(mockElement)
      mockIsEmpty.mockReturnValue(true)

      const param = {
        type: PAGE_ACTION_EVENT.input,
        selector: ".input",
        selectorType: SelectorType.css,
        label: "Input",
        value: "",
        srcUrl: "",
        selectedText: "",
        clipboardText: "",
      }

      const result = await PageActionDispatcher.input(param as any)

      expect(result).toEqual([true])
      expect(mockUserInstance.type).not.toHaveBeenCalled()
      expect(mockInputContentEditable).not.toHaveBeenCalled()
    })

    it("PDI-10: Should return error when element not found", async () => {
      mockDocument.querySelector.mockReturnValue(null)

      const param = {
        type: PAGE_ACTION_EVENT.input,
        selector: ".not-found",
        selectorType: SelectorType.css,
        label: "Not Found",
        value: "test",
        srcUrl: "",
        selectedText: "",
        clipboardText: "",
      }

      const resultPromise = PageActionDispatcher.input(param as any)
      vi.advanceTimersByTime(1100)

      const result = await resultPromise

      expect(result).toEqual([false, "Element not found: Not Found"])
      expect(mockConsole.warn).toHaveBeenCalledWith(
        "Element not found for: .not-found",
      )
    })

    it("PDI-11: Should include user variables in the variable map", async () => {
      const mockElement = mockElements.input
      mockDocument.querySelector.mockReturnValue(mockElement)
      mockIsEditable.mockReturnValue(false)

      const param = {
        type: PAGE_ACTION_EVENT.input,
        selector: ".input",
        selectorType: SelectorType.css,
        label: "Input",
        value: "{{myVar}}",
        srcUrl: "",
        selectedText: "",
        clipboardText: "",
        userVariables: [{ name: "myVar", value: "custom value" }],
      }

      await PageActionDispatcher.input(param as any)

      expect(mockSafeInterpolate).toHaveBeenCalledWith(
        "{{myVar}}",
        expect.objectContaining({
          myVar: "custom value",
        }),
      )
    })
  })
})
