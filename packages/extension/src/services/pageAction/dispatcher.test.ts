import { beforeEach, afterEach, describe, it, expect, vi } from "vitest"
import {
  SelectorType,
  PAGE_ACTION_EVENT,
  PAGE_ACTION_CONDITION_ACTION,
  PAGE_ACTION_CONDITION_TYPE,
} from "@/const"

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
    PAGE_HTML: "pageHtml",
    SELECTION_HTML: "selectionHtml",
  },
  InsertSymbol: {
    selectedText: "{{selectedText}}",
    url: "{{url}}",
    clipboard: "{{clipboard}}",
    lang: "{{lang}}",
    pageHtml: "{{pageHtml}}",
    selectionHtml: "{{selectionHtml}}",
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
  warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
}

// beforeEach replaces global.document with a plain mock, so capture the real
// createElement now to build fresh elements inside tests (e.g. for the
// clickable-condition tests, which need a real, mutable button per test).
const realCreateElement = document.createElement.bind(document)

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
  filePasteTarget: (() => {
    const div = document.createElement("div")
    div.dispatchEvent = vi.fn()
    div.focus = vi.fn()
    return div
  })(),
}

// jsdom does not implement DataTransfer/ClipboardEvent, so filePaste's use
// of `new DataTransfer()` / `new ClipboardEvent("paste", ...)` needs a
// minimal stand-in to run under test.
class MockDataTransfer {
  files: File[] = []
  items = {
    add: (file: File) => {
      this.files.push(file)
    },
  }
}

class MockClipboardEvent extends Event {
  clipboardData: MockDataTransfer | null
  constructor(
    type: string,
    init?: EventInit & { clipboardData?: MockDataTransfer },
  ) {
    super(type, init)
    this.clipboardData = init?.clipboardData ?? null
  }
}

// jsdom's File/Blob don't implement `.text()`, so read via FileReader instead.
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsText(file)
  })
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
    global.DataTransfer = MockDataTransfer as any
    global.ClipboardEvent = MockClipboardEvent as any
    mockDocument.querySelector.mockReturnValue(null)

    // Reset element mocks
    mockElements.input.value = ""
    mockElements.contentEditableDiv.innerText = ""
    mockElements.input.dispatchEvent = vi.fn()
    mockElements.div.dispatchEvent = vi.fn()
    mockElements.contentEditableDiv.dispatchEvent = vi.fn()
    mockElements.input.focus = vi.fn()
    mockElements.filePasteTarget.dispatchEvent = vi.fn()
    mockElements.filePasteTarget.focus = vi.fn()
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

    it("PDC-04: Should click as soon as the element becomes clickable (condition=waitUntil clickable)", async () => {
      const button = realCreateElement("button")
      button.disabled = true
      // jsdom doesn't perform layout, so getBoundingClientRect always
      // reports zero size; stub it to simulate a rendered, sized element.
      button.getBoundingClientRect = vi.fn(() => ({
        width: 10,
        height: 10,
      })) as any
      button.dispatchEvent = vi.fn()
      mockDocument.querySelector.mockReturnValue(button)

      const param = {
        type: PAGE_ACTION_EVENT.click,
        selector: ".submit",
        selectorType: SelectorType.css,
        label: "Submit",
        condition: {
          actionType: PAGE_ACTION_CONDITION_ACTION.waitUntil,
          conditionType: PAGE_ACTION_CONDITION_TYPE.clickable,
          selector: ".submit",
          selectorType: SelectorType.css,
        },
      }

      const resultPromise = PageActionDispatcher.click(param as any)

      // First poll tick sees the element still disabled.
      await vi.advanceTimersByTimeAsync(60)
      expect(mockUserInstance.click).not.toHaveBeenCalled()

      // Element becomes enabled before the next poll tick.
      button.disabled = false
      await vi.advanceTimersByTimeAsync(60)

      const result = await resultPromise

      expect(result).toEqual([true])
      expect(mockUserInstance.click).toHaveBeenCalledWith(button)
    })

    it("PDC-05: Should time out with a message describing why the element never became clickable", async () => {
      const button = realCreateElement("button")
      button.disabled = true
      button.getBoundingClientRect = vi.fn(() => ({
        width: 10,
        height: 10,
      })) as any
      mockDocument.querySelector.mockReturnValue(button)

      const param = {
        type: PAGE_ACTION_EVENT.click,
        selector: ".submit",
        selectorType: SelectorType.css,
        label: "Submit",
        condition: {
          actionType: PAGE_ACTION_CONDITION_ACTION.waitUntil,
          conditionType: PAGE_ACTION_CONDITION_TYPE.clickable,
          selector: ".submit",
          selectorType: SelectorType.css,
        },
      }

      const resultPromise = PageActionDispatcher.click(param as any)
      await vi.advanceTimersByTimeAsync(2100)
      const result = await resultPromise

      expect(result).toEqual([
        false,
        "Element not clickable (disabled): Submit",
      ])
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining("Failing conditions: [disabled]"),
        button,
      )
    })

    it("PDC-06: Should time out with 'Element not found' when the element never appears (condition=waitUntil clickable)", async () => {
      mockDocument.querySelector.mockReturnValue(null)

      const param = {
        type: PAGE_ACTION_EVENT.click,
        selector: ".missing",
        selectorType: SelectorType.css,
        label: "Missing",
        condition: {
          actionType: PAGE_ACTION_CONDITION_ACTION.waitUntil,
          conditionType: PAGE_ACTION_CONDITION_TYPE.clickable,
          selector: ".missing",
          selectorType: SelectorType.css,
        },
      }

      const resultPromise = PageActionDispatcher.click(param as any)
      await vi.advanceTimersByTimeAsync(2100)
      const result = await resultPromise

      expect(result).toEqual([false, "Element not found: Missing"])
    })

    it("PDC-07: Should skip the click when the condition selector's value is empty (actionType=skip)", async () => {
      mockDocument.querySelector.mockImplementation((selector: string) => {
        if (selector === ".input") return mockElements.input
        if (selector === ".submit") return mockElements.div
        return null
      })
      mockElements.input.value = ""

      const param = {
        type: PAGE_ACTION_EVENT.click,
        selector: ".submit",
        selectorType: SelectorType.css,
        label: "Submit",
        condition: {
          actionType: PAGE_ACTION_CONDITION_ACTION.skip,
          conditionType: PAGE_ACTION_CONDITION_TYPE.empty,
          selector: ".input",
          selectorType: SelectorType.css,
        },
      }

      const result = await PageActionDispatcher.click(param as any)

      expect(result).toEqual([true])
      expect(mockUserInstance.click).not.toHaveBeenCalled()
    })

    it("PDC-08: Should proceed with the click when the condition selector's value is not empty (actionType=skip)", async () => {
      mockDocument.querySelector.mockImplementation((selector: string) => {
        if (selector === ".input") return mockElements.input
        if (selector === ".submit") return mockElements.div
        return null
      })
      mockElements.input.value = "unsent prompt"

      const param = {
        type: PAGE_ACTION_EVENT.click,
        selector: ".submit",
        selectorType: SelectorType.css,
        label: "Submit",
        condition: {
          actionType: PAGE_ACTION_CONDITION_ACTION.skip,
          conditionType: PAGE_ACTION_CONDITION_TYPE.empty,
          selector: ".input",
          selectorType: SelectorType.css,
        },
      }

      const result = await PageActionDispatcher.click(param as any)

      expect(result).toEqual([true])
      expect(mockUserInstance.click).toHaveBeenCalledWith(mockElements.div)
    })

    it("PDC-09: Should wait until the condition is met before clicking (actionType=waitUntil)", async () => {
      mockDocument.querySelector.mockImplementation((selector: string) => {
        if (selector === ".input") return mockElements.input
        if (selector === ".submit") return mockElements.div
        return null
      })
      mockElements.input.value = "still typing"

      const param = {
        type: PAGE_ACTION_EVENT.click,
        selector: ".submit",
        selectorType: SelectorType.css,
        label: "Submit",
        condition: {
          actionType: PAGE_ACTION_CONDITION_ACTION.waitUntil,
          conditionType: PAGE_ACTION_CONDITION_TYPE.empty,
          selector: ".input",
          selectorType: SelectorType.css,
        },
      }

      const resultPromise = PageActionDispatcher.click(param as any)

      // First poll tick sees the input still non-empty.
      await vi.advanceTimersByTimeAsync(60)
      expect(mockUserInstance.click).not.toHaveBeenCalled()

      // Input becomes empty before the next poll tick.
      mockElements.input.value = ""
      await vi.advanceTimersByTimeAsync(60)

      const result = await resultPromise

      expect(result).toEqual([true])
      expect(mockUserInstance.click).toHaveBeenCalledWith(mockElements.div)
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
        10,
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

  describe("PageActionDispatcher.filePaste", () => {
    it("PDF-01: Should return error when element not found", async () => {
      mockDocument.querySelector.mockReturnValue(null)

      const param = {
        type: PAGE_ACTION_EVENT.filePaste,
        selector: ".not-found",
        selectorType: SelectorType.css,
        label: "Paste HTML",
        value: "{{pageHtml}}",
        fileName: "page.html",
        fileType: "text/html",
        pageHtml: "<p>hi</p>",
      }

      const resultPromise = PageActionDispatcher.filePaste(param as any)
      vi.advanceTimersByTime(1100)

      const result = await resultPromise

      expect(result).toEqual([false, "Element not found: Paste HTML"])
      expect(mockConsole.warn).toHaveBeenCalledWith(
        "Element not found for: .not-found",
      )
    })

    it("PDF-02: Should expand PAGE_HTML/SELECTION_HTML placeholders and paste the result as a File", async () => {
      const mockElement = mockElements.filePasteTarget
      mockDocument.querySelector.mockReturnValue(mockElement)
      mockSafeInterpolate.mockImplementation(
        (template: string, vars: Record<string, string>) =>
          Object.entries(vars).reduce(
            (acc, [key, value]) => acc.split(key).join(value),
            template,
          ),
      )

      const param = {
        type: PAGE_ACTION_EVENT.filePaste,
        selector: ".chat-input",
        selectorType: SelectorType.css,
        label: "Paste page HTML",
        value: "prefix {{pageHtml}} {{selectionHtml}} suffix",
        fileName: "my-page.html",
        fileType: "text/html",
        pageHtml: "<h1>Page</h1>",
        selectionHtml: "<b>Selection</b>",
      }

      const result = await PageActionDispatcher.filePaste(param as any)

      expect(result).toEqual([true])
      expect(mockSafeInterpolate).toHaveBeenCalledWith(
        "prefix {{pageHtml}} {{selectionHtml}} suffix",
        {
          "{{pageHtml}}": "<h1>Page</h1>",
          "{{selectionHtml}}": "<b>Selection</b>",
        },
      )
      expect(mockElement.focus).toHaveBeenCalled()
      expect(mockElement.dispatchEvent).toHaveBeenCalledTimes(1)

      const dispatchedEvent = (mockElement.dispatchEvent as any).mock
        .calls[0][0]
      expect(dispatchedEvent.type).toBe("paste")
      expect(dispatchedEvent.bubbles).toBe(true)
      expect(dispatchedEvent.cancelable).toBe(true)
      expect(dispatchedEvent.clipboardData).toBeInstanceOf(MockDataTransfer)

      const file = dispatchedEvent.clipboardData.files[0]
      expect(file.name).toBe("my-page.html")
      expect(file.type).toBe("text/html")
      expect(await readFileAsText(file)).toBe(
        "prefix <h1>Page</h1> <b>Selection</b> suffix",
      )
    })

    it("PDF-03: Should default missing pageHtml/selectionHtml to empty strings", async () => {
      const mockElement = mockElements.filePasteTarget
      mockDocument.querySelector.mockReturnValue(mockElement)

      const param = {
        type: PAGE_ACTION_EVENT.filePaste,
        selector: ".chat-input",
        selectorType: SelectorType.css,
        label: "Paste page HTML",
        value: "{{pageHtml}}{{selectionHtml}}",
        fileName: "page.html",
        fileType: "text/html",
      }

      await PageActionDispatcher.filePaste(param as any)

      expect(mockSafeInterpolate).toHaveBeenCalledWith(
        "{{pageHtml}}{{selectionHtml}}",
        {
          "{{pageHtml}}": "",
          "{{selectionHtml}}": "",
        },
      )
    })
  })
})
