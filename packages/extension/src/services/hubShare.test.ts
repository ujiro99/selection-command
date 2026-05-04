import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  getHubLocale,
  toSubmitCommandInput,
  shareCommandToHub,
  _resetShareState,
} from "./hubShare"
import { OPEN_MODE, PAGE_ACTION_OPEN_MODE } from "@/const"
import type { SearchCommand, PageActionCommand, AiPromptCommand } from "@/types"

// ---- Fixtures --------------------------------------------------------------

const baseCmd = {
  id: "cmd-1",
  title: "Test Command",
  iconUrl: "https://example.com/icon.png",
}

const makeSearchCmd = (overrides?: Partial<SearchCommand>): SearchCommand => ({
  ...baseCmd,
  openMode: OPEN_MODE.POPUP,
  searchUrl: "https://google.com/search?q=%s",
  ...overrides,
})

const makePageActionCmd = (
  overrides?: Partial<PageActionCommand>,
): PageActionCommand => ({
  ...baseCmd,
  openMode: OPEN_MODE.PAGE_ACTION,
  pageActionOption: {
    startUrl: "https://example.com",
    steps: [],
    openMode: PAGE_ACTION_OPEN_MODE.TAB,
  },
  ...overrides,
})

const makeAiPromptCmd = (
  overrides?: Partial<AiPromptCommand>,
): AiPromptCommand => ({
  ...baseCmd,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: {
    serviceId: "gemini",
    prompt: "Summarize: {{SelectedText}}",
    openMode: OPEN_MODE.SIDE_PANEL,
  },
  ...overrides,
})

// ---- getHubLocale ----------------------------------------------------------

describe("getHubLocale", () => {
  beforeEach(() => {
    vi.spyOn(chrome.i18n, "getUILanguage")
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("GL-01: returns an exact-match locale", () => {
    vi.mocked(chrome.i18n.getUILanguage).mockReturnValue("ja")
    expect(getHubLocale()).toBe("ja")
  })

  it("GL-02: resolves locale by prefix match (zh-TW → zh-CN)", () => {
    vi.mocked(chrome.i18n.getUILanguage).mockReturnValue("zh-TW")
    expect(getHubLocale()).toBe("zh-CN")
  })

  it("GL-03: resolves locale by prefix match (pt-BR → pt-BR)", () => {
    vi.mocked(chrome.i18n.getUILanguage).mockReturnValue("pt-BR")
    expect(getHubLocale()).toBe("pt-BR")
  })

  it("GL-04: returns default 'en' for unsupported languages", () => {
    vi.mocked(chrome.i18n.getUILanguage).mockReturnValue("xx-UNKNOWN")
    expect(getHubLocale()).toBe("en")
  })
})

// ---- toSubmitCommandInput --------------------------------------------------

describe("toSubmitCommandInput", () => {
  beforeEach(() => {
    vi.spyOn(chrome.i18n, "getUILanguage").mockReturnValue("en")
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // --- Search commands ---

  it("SC-01: converts a POPUP command correctly", () => {
    const cmd = makeSearchCmd({ openMode: OPEN_MODE.POPUP })
    const result = toSubmitCommandInput(cmd)
    expect(result).not.toBeNull()
    expect(result!.openMode).toBe(OPEN_MODE.POPUP)
    expect(result!.targetUrl).toBe("https://google.com/search?q=%s")
    expect((result! as SearchCommand).searchUrl).toBe(
      "https://google.com/search?q=%s",
    )
  })

  it("SC-02: converts a TAB command correctly", () => {
    const cmd = makeSearchCmd({ openMode: OPEN_MODE.TAB })
    const result = toSubmitCommandInput(cmd)
    expect(result).not.toBeNull()
    expect(result!.openMode).toBe(OPEN_MODE.TAB)
  })

  it("SC-03: returns null when searchUrl is not set", () => {
    const cmd = makeSearchCmd({ searchUrl: undefined })
    expect(toSubmitCommandInput(cmd)).toBeNull()
  })

  it("SC-04: includes openModeSecondary in command", () => {
    const cmd = makeSearchCmd({ openModeSecondary: OPEN_MODE.TAB })
    const result = toSubmitCommandInput(cmd)
    expect((result! as SearchCommand).openModeSecondary).toBe(OPEN_MODE.TAB)
  })

  it("SC-05: includes spaceEncoding in command", () => {
    const cmd = makeSearchCmd({ spaceEncoding: "plus" as any })
    const result = toSubmitCommandInput(cmd)
    expect((result! as SearchCommand).spaceEncoding).toBe("plus")
  })

  it("SC-06: omits openModeSecondary from command when not set", () => {
    const cmd = makeSearchCmd()
    const result = toSubmitCommandInput(cmd)
    expect(result!).not.toHaveProperty("openModeSecondary")
  })

  // --- PAGE_ACTION ---

  it("PA-01: converts a PAGE_ACTION command correctly", () => {
    const cmd = makePageActionCmd()
    const result = toSubmitCommandInput(cmd)
    expect(result).not.toBeNull()
    expect(result!.openMode).toBe(OPEN_MODE.PAGE_ACTION)
    expect(result!.targetUrl).toBe("https://example.com")
    expect((result! as PageActionCommand).pageActionOption).toMatchObject({
      startUrl: "https://example.com",
      steps: [],
      openMode: PAGE_ACTION_OPEN_MODE.TAB,
    })
  })

  it("PA-02: returns non-null result even when startUrl is not set", () => {
    const cmd = makePageActionCmd({
      pageActionOption: {
        steps: [],
        openMode: PAGE_ACTION_OPEN_MODE.TAB,
        startUrl: undefined as any,
      },
    })
    expect(toSubmitCommandInput(cmd)).not.toBeNull()
  })

  // --- AI_PROMPT ---

  it("AI-01: converts an AI_PROMPT command correctly (gemini)", () => {
    const cmd = makeAiPromptCmd()
    const result = toSubmitCommandInput(cmd)
    expect(result).not.toBeNull()
    expect(result!.openMode).toBe(OPEN_MODE.AI_PROMPT)
    expect(result!.targetUrl).toBe("https://gemini.google.com/app")
    expect((result! as AiPromptCommand).aiPromptOption).toMatchObject({
      serviceId: "gemini",
      prompt: "Summarize: {{SelectedText}}",
      openMode: OPEN_MODE.SIDE_PANEL,
    })
  })

  it("AI-02: converts an AI_PROMPT command correctly (chatgpt)", () => {
    const cmd = makeAiPromptCmd({
      aiPromptOption: {
        serviceId: "chatgpt",
        prompt: "Translate: {{SelectedText}}",
        openMode: OPEN_MODE.POPUP,
      },
    })
    const result = toSubmitCommandInput(cmd)
    expect(result).not.toBeNull()
    expect(result!.targetUrl).toBe("https://chatgpt.com")
    expect((result! as AiPromptCommand).aiPromptOption.serviceId).toBe(
      "chatgpt",
    )
  })

  it("AI-03: sets targetUrl to empty string for unknown serviceId", () => {
    const cmd = makeAiPromptCmd({
      aiPromptOption: {
        serviceId: "unknown-service",
        prompt: "Hello",
        openMode: OPEN_MODE.POPUP,
      },
    })
    const result = toSubmitCommandInput(cmd)
    expect(result!.targetUrl).toBe("")
  })

  it("AI-04: inherits title, iconUrl, and locale from command", () => {
    const cmd = makeAiPromptCmd()
    const result = toSubmitCommandInput(cmd)
    expect(result!.title).toBe("Test Command")
    expect(result!.iconUrl).toBe("https://example.com/icon.png")
    expect(result!.locale).toBe("en")
  })
})

// ---- shareCommandToHub -----------------------------------------------------

describe("shareCommandToHub", () => {
  let mockHubWindow: { postMessage: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    vi.spyOn(chrome.i18n, "getUILanguage").mockReturnValue("en")
    vi.useFakeTimers()

    mockHubWindow = { postMessage: vi.fn() }
    vi.spyOn(window, "open").mockReturnValue(mockHubWindow as any)
    vi.spyOn(window, "addEventListener")
    vi.spyOn(window, "removeEventListener")
  })

  afterEach(() => {
    _resetShareState()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it("SH-01: opens Hub window and returns true for a valid command", () => {
    const result = shareCommandToHub(makeSearchCmd())
    expect(result).toBe(true)
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining("/en/dashboard/commands"),
      "_blank",
    )
  })

  it("SH-02: returns false when the command has no searchUrl", () => {
    const result = shareCommandToHub(makeSearchCmd({ searchUrl: undefined }))
    expect(result).toBe(false)
    expect(window.open).not.toHaveBeenCalled()
  })

  it("SH-03: returns false when window.open returns null", () => {
    vi.mocked(window.open).mockReturnValue(null)
    const result = shareCommandToHub(makeSearchCmd())
    expect(result).toBe(false)
  })

  it("SH-04: sends postMessage on each interval tick", () => {
    shareCommandToHub(makeSearchCmd())
    vi.advanceTimersByTime(500)
    expect(mockHubWindow.postMessage).toHaveBeenCalledTimes(1)
    expect(mockHubWindow.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: "share-command" }),
      expect.any(String),
    )
    vi.advanceTimersByTime(500)
    expect(mockHubWindow.postMessage).toHaveBeenCalledTimes(2)
  })

  it("SH-05: stops retrying after receiving share-command-ack", () => {
    const NEW_HUB_URL =
      import.meta.env.VITE_NEW_HUB_URL ??
      "https://selection-command-hub.pages.dev"

    shareCommandToHub(makeSearchCmd())

    const ackEvent = new MessageEvent("message", {
      origin: NEW_HUB_URL,
      data: { type: "share-command-ack" },
    })
    window.dispatchEvent(ackEvent)

    const beforeCount = mockHubWindow.postMessage.mock.calls.length
    vi.advanceTimersByTime(2000)
    expect(mockHubWindow.postMessage.mock.calls.length).toBe(beforeCount)
  })

  it("SH-06: can share an AI_PROMPT command", () => {
    const result = shareCommandToHub(makeAiPromptCmd())
    expect(result).toBe(true)
    vi.advanceTimersByTime(500)
    expect(mockHubWindow.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "share-command",
        command: expect.objectContaining({
          openMode: OPEN_MODE.AI_PROMPT,
          targetUrl: "https://gemini.google.com/app",
        }),
      }),
      expect.any(String),
    )
  })

  it("SH-07: can share a PAGE_ACTION command", () => {
    const result = shareCommandToHub(makePageActionCmd())
    expect(result).toBe(true)
    vi.advanceTimersByTime(500)
    expect(mockHubWindow.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "share-command",
        command: expect.objectContaining({
          openMode: OPEN_MODE.PAGE_ACTION,
          targetUrl: "https://example.com",
        }),
      }),
      expect.any(String),
    )
  })
})
