import { describe, it, expect, vi, beforeEach } from "vitest"
import { AiPrompt, convertUrlsToMarkdown } from "./aiPrompt"
import { Ipc, BgCommand } from "@/services/ipc"
import { findAiService } from "@/services/aiPrompt"
import { Storage } from "@/services/storage"
import { OPEN_MODE, PAGE_ACTION_EVENT } from "@/const"
import type { AiService } from "@/types"

vi.mock("@/services/ipc", () => ({
  Ipc: {
    send: vi.fn(),
  },
  BgCommand: {
    openAndRunPageAction: "openAndRunPageAction",
    openSidePanel: "openSidePanel",
  },
}))

vi.mock("@/services/aiPrompt", () => ({
  findAiService: vi.fn(),
}))

vi.mock("@/services/storage", () => ({
  Storage: {
    set: vi.fn().mockResolvedValue(undefined),
  },
  SESSION_STORAGE_KEY: {
    PA_SIDE_PANEL_PENDING: "PA_SIDE_PANEL_PENDING",
  },
}))

vi.mock("@/services/screen", () => ({
  getWindowPosition: vi.fn().mockResolvedValue({ top: 0, left: 0 }),
}))

vi.mock("@/services/i18n", () => ({
  getUILanguage: vi.fn().mockReturnValue("en"),
  t: vi.fn((key: string) => key),
}))

vi.mock("@/services/option/defaultSettings", () => ({
  PopupOption: { width: 800, height: 600 },
}))

// Minimal AiService fixtures
const makeDomService = (overrides?: Partial<AiService>): AiService => ({
  id: "gemini",
  name: "Gemini",
  url: "https://gemini.google.com/app",
  faviconUrl: "",
  inputSelectors: [".ql-editor"],
  submitSelectors: ["button.send"],
  selectorType: "css" as any,
  ...overrides,
})

const makeQueryService = (overrides?: Partial<AiService>): AiService => ({
  id: "chatgpt",
  name: "ChatGPT",
  url: "https://chatgpt.com",
  faviconUrl: "",
  inputSelectors: ["#prompt-textarea"],
  submitSelectors: ["button#submit"],
  selectorType: "css" as any,
  queryUrl: "https://chatgpt.com/?prompt=%s",
  autoSubmit: false,
  ...overrides,
})

const makeAutoSubmitService = (overrides?: Partial<AiService>): AiService => ({
  id: "perplexity",
  name: "Perplexity",
  url: "https://www.perplexity.ai",
  faviconUrl: "",
  inputSelectors: ["div#ask-input"],
  submitSelectors: ["button[aria-label='Submit']"],
  selectorType: "css" as any,
  queryUrl: "https://www.perplexity.ai/search/new?q=%s",
  autoSubmit: true,
  urlToMarkdown: true,
  ...overrides,
})

const baseCommand = {
  id: "cmd-1",
  title: "Test",
  openMode: OPEN_MODE.AI_PROMPT,
  iconUrl: "",
  popupOption: { width: 800, height: 600 },
  aiPromptOption: {
    serviceId: "chatgpt",
    prompt: "Explain: {{SelectedText}}",
    openMode: OPEN_MODE.POPUP,
  },
}

describe("AiPrompt.execute", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock location.href for content script context
    Object.defineProperty(window, "location", {
      value: { href: "https://example.com/page" },
      writable: true,
    })
  })

  describe("DOM input approach (no queryUrl)", () => {
    it("AP-01: should include input and submit steps when no queryUrl", async () => {
      vi.mocked(findAiService).mockResolvedValue(makeDomService())

      await AiPrompt.execute({
        selectionText: "hello world",
        command: { ...baseCommand, aiPromptOption: { ...baseCommand.aiPromptOption, serviceId: "gemini" } } as any,
        position: { x: 100, y: 100 },
      })

      expect(Ipc.send).toHaveBeenCalledWith(
        BgCommand.openAndRunPageAction,
        expect.objectContaining({
          steps: expect.arrayContaining([
            expect.objectContaining({ param: expect.objectContaining({ type: PAGE_ACTION_EVENT.input }) }),
            expect.objectContaining({ param: expect.objectContaining({ type: PAGE_ACTION_EVENT.click }) }),
          ]),
        }),
      )
    })

    it("AP-02: should use service.url as searchUrl when no queryUrl", async () => {
      vi.mocked(findAiService).mockResolvedValue(makeDomService())

      await AiPrompt.execute({
        selectionText: "hello",
        command: { ...baseCommand, aiPromptOption: { ...baseCommand.aiPromptOption, serviceId: "gemini" } } as any,
        position: { x: 0, y: 0 },
      })

      expect(Ipc.send).toHaveBeenCalledWith(
        BgCommand.openAndRunPageAction,
        expect.objectContaining({
          url: expect.objectContaining({ searchUrl: "https://gemini.google.com/app" }),
        }),
      )
    })
  })

  describe("URL query input approach (with queryUrl)", () => {
    it("AP-03: should NOT include input step when queryUrl is present", async () => {
      vi.mocked(findAiService).mockResolvedValue(makeQueryService())

      await AiPrompt.execute({
        selectionText: "hello",
        command: baseCommand as any,
        position: { x: 0, y: 0 },
      })

      const sentArgs = vi.mocked(Ipc.send).mock.calls[0][1] as any
      const stepTypes = sentArgs.steps.map((s: any) => s.param.type)
      expect(stepTypes).not.toContain(PAGE_ACTION_EVENT.input)
    })

    it("AP-04: should include submit step when queryUrl is present and autoSubmit is false", async () => {
      vi.mocked(findAiService).mockResolvedValue(makeQueryService())

      await AiPrompt.execute({
        selectionText: "hello",
        command: baseCommand as any,
        position: { x: 0, y: 0 },
      })

      const sentArgs = vi.mocked(Ipc.send).mock.calls[0][1] as any
      const stepTypes = sentArgs.steps.map((s: any) => s.param.type)
      expect(stepTypes).toContain(PAGE_ACTION_EVENT.click)
    })

    it("AP-05: should NOT include submit step when autoSubmit is true", async () => {
      vi.mocked(findAiService).mockResolvedValue(makeAutoSubmitService())

      await AiPrompt.execute({
        selectionText: "hello",
        command: {
          ...baseCommand,
          aiPromptOption: { ...baseCommand.aiPromptOption, serviceId: "perplexity" },
        } as any,
        position: { x: 0, y: 0 },
      })

      const sentArgs = vi.mocked(Ipc.send).mock.calls[0][1] as any
      const stepTypes = sentArgs.steps.map((s: any) => s.param.type)
      expect(stepTypes).not.toContain(PAGE_ACTION_EVENT.click)
      expect(stepTypes).not.toContain(PAGE_ACTION_EVENT.input)
    })

    it("AP-06: should use queryUrl as searchUrl when queryUrl is present", async () => {
      vi.mocked(findAiService).mockResolvedValue(makeQueryService())

      await AiPrompt.execute({
        selectionText: "hello",
        command: baseCommand as any,
        position: { x: 0, y: 0 },
      })

      const sentArgs = vi.mocked(Ipc.send).mock.calls[0][1] as any
      expect(sentArgs.url.searchUrl).toBe("https://chatgpt.com/?prompt=%s")
    })

    it("AP-07: should expand {{SelectedText}} in the prompt and use as selectionText in UrlParam", async () => {
      vi.mocked(findAiService).mockResolvedValue(makeQueryService())

      await AiPrompt.execute({
        selectionText: "hello world",
        command: baseCommand as any, // prompt: "Explain: {{SelectedText}}"
        position: { x: 0, y: 0 },
      })

      const sentArgs = vi.mocked(Ipc.send).mock.calls[0][1] as any
      expect(sentArgs.url.selectionText).toBe("Explain: hello world")
    })

    it("AP-08: should fall back to DOM input when prompt contains {{Clipboard}}", async () => {
      vi.mocked(findAiService).mockResolvedValue(makeQueryService())

      await AiPrompt.execute({
        selectionText: "hello",
        command: {
          ...baseCommand,
          aiPromptOption: {
            ...baseCommand.aiPromptOption,
            prompt: "{{Clipboard}} + {{SelectedText}}",
          },
        } as any,
        position: { x: 0, y: 0 },
      })

      // Should fall back to DOM approach: input step should be present
      const sentArgs = vi.mocked(Ipc.send).mock.calls[0][1] as any
      const stepTypes = sentArgs.steps.map((s: any) => s.param.type)
      expect(stepTypes).toContain(PAGE_ACTION_EVENT.input)
      // searchUrl should be the plain service URL, not queryUrl
      expect(sentArgs.url.searchUrl).toBe("https://chatgpt.com")
    })
  })

  describe("Side panel mode with queryUrl", () => {
    it("AP-09: should store pending action with queryUrl-based URL for side panel", async () => {
      vi.mocked(findAiService).mockResolvedValue(makeQueryService())

      await AiPrompt.execute({
        selectionText: "hello",
        command: {
          ...baseCommand,
          aiPromptOption: {
            ...baseCommand.aiPromptOption,
            openMode: OPEN_MODE.SIDE_PANEL,
          },
        } as any,
        position: null,
      })

      expect(Storage.set).toHaveBeenCalled()
      const storedPending = vi.mocked(Storage.set).mock.calls[0][1] as any
      // The pending URL should be the resolved query URL (with prompt embedded), not the plain service URL
      expect(storedPending.url).toMatch(/chatgpt\.com\/\?prompt=.+/)
    })

    it("AP-10: should NOT include input step in side panel pending steps when queryUrl is used", async () => {
      vi.mocked(findAiService).mockResolvedValue(makeQueryService())

      await AiPrompt.execute({
        selectionText: "hello",
        command: {
          ...baseCommand,
          aiPromptOption: {
            ...baseCommand.aiPromptOption,
            openMode: OPEN_MODE.SIDE_PANEL,
          },
        } as any,
        position: null,
      })

      const storedPending = vi.mocked(Storage.set).mock.calls[0][1] as any
      const stepTypes = storedPending.steps.map((s: any) => s.param.type)
      expect(stepTypes).not.toContain(PAGE_ACTION_EVENT.input)
    })
  })

  describe("URL to Markdown conversion (urlToMarkdown)", () => {
    it("AP-11: should convert bare URLs to Markdown format when urlToMarkdown is true", async () => {
      vi.mocked(findAiService).mockResolvedValue(makeAutoSubmitService())

      await AiPrompt.execute({
        selectionText: "https://example.com/page",
        command: {
          ...baseCommand,
          aiPromptOption: {
            ...baseCommand.aiPromptOption,
            serviceId: "perplexity",
            prompt: "Summarize: {{SelectedText}}",
          },
        } as any,
        position: { x: 0, y: 0 },
      })

      const sentArgs = vi.mocked(Ipc.send).mock.calls[0][1] as any
      expect(sentArgs.url.selectionText).toBe(
        "Summarize: [https://example.com/page](https://example.com/page)",
      )
    })

    it("AP-12: should convert {{Url}} expansion to Markdown format when urlToMarkdown is true", async () => {
      vi.mocked(findAiService).mockResolvedValue(makeAutoSubmitService())

      await AiPrompt.execute({
        selectionText: "hello",
        command: {
          ...baseCommand,
          aiPromptOption: {
            ...baseCommand.aiPromptOption,
            serviceId: "perplexity",
            prompt: "Summarize {{Url}}",
          },
        } as any,
        position: { x: 0, y: 0 },
      })

      const sentArgs = vi.mocked(Ipc.send).mock.calls[0][1] as any
      // location.href is "https://example.com/page" from beforeEach mock
      expect(sentArgs.url.selectionText).toBe(
        "Summarize [https://example.com/page](https://example.com/page)",
      )
    })

    it("AP-13: should NOT convert URLs when urlToMarkdown is false", async () => {
      vi.mocked(findAiService).mockResolvedValue(
        makeQueryService({ urlToMarkdown: false }),
      )

      await AiPrompt.execute({
        selectionText: "https://example.com/page",
        command: {
          ...baseCommand,
          aiPromptOption: {
            ...baseCommand.aiPromptOption,
            prompt: "Summarize: {{SelectedText}}",
          },
        } as any,
        position: { x: 0, y: 0 },
      })

      const sentArgs = vi.mocked(Ipc.send).mock.calls[0][1] as any
      expect(sentArgs.url.selectionText).toBe("Summarize: https://example.com/page")
    })
  })

  describe("convertUrlsToMarkdown", () => {
    it("CU-01: should convert a bare URL to Markdown link format", () => {
      expect(convertUrlsToMarkdown("https://example.com")).toBe(
        "[https://example.com](https://example.com)",
      )
    })

    it("CU-02: should convert multiple bare URLs in text", () => {
      const result = convertUrlsToMarkdown(
        "Check https://example.com and https://other.com for details",
      )
      expect(result).toBe(
        "Check [https://example.com](https://example.com) and [https://other.com](https://other.com) for details",
      )
    })

    it("CU-03: should not double-convert URLs already in Markdown format", () => {
      const input = "[https://example.com](https://example.com)"
      expect(convertUrlsToMarkdown(input)).toBe(input)
    })

    it("CU-03b: should not convert Markdown links with non-URL text labels", () => {
      const input = "[Example Site](https://example.com)"
      expect(convertUrlsToMarkdown(input)).toBe(input)
    })

    it("CU-04: should handle text with no URLs unchanged", () => {
      expect(convertUrlsToMarkdown("hello world")).toBe("hello world")
    })

    it("CU-05: should convert http URLs as well as https", () => {
      expect(convertUrlsToMarkdown("http://example.com")).toBe(
        "[http://example.com](http://example.com)",
      )
    })

    it("CU-06: should strip trailing comma from URL", () => {
      const result = convertUrlsToMarkdown("Check https://example.com, please")
      expect(result).toBe(
        "Check [https://example.com](https://example.com), please",
      )
    })

    it("CU-07: should strip trailing period from URL", () => {
      const result = convertUrlsToMarkdown("See https://example.com.")
      expect(result).toBe("See [https://example.com](https://example.com).")
    })
  })
})
