import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

const { mockSendTab } = vi.hoisted(() => ({ mockSendTab: vi.fn() }))

vi.mock("@/services/ipc", () => ({
  Ipc: { sendTab: mockSendTab },
  TabCommand: { checkAiSelectors: "checkAiSelectors" },
}))
vi.mock("@/services/aiPrompt", () => ({
  AI_SERVICES_URL: "https://hub.example/data/ai-services.json",
}))

import { runAiSelectorCheck } from "../runner"
import { SELECTOR_KIND, VERDICT } from "../result"

const services = [
  {
    id: "gemini",
    name: "Gemini",
    url: "https://gemini.example",
    inputSelectors: ["#in"],
    submitSelectors: ["#send"],
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    url: "https://chatgpt.example",
    inputSelectors: ["#in"],
    submitSelectors: ["#send"],
  },
]

const CURRENT_WINDOW_ID = 1
const INCOGNITO_WINDOW_ID = 2
const INITIAL_TAB_ID = 100

describe("runAiSelectorCheck", () => {
  let tabsCreate: ReturnType<typeof vi.fn>
  let tabsRemove: ReturnType<typeof vi.fn>
  let windowsCreate: ReturnType<typeof vi.fn>
  let windowsGetAll: ReturnType<typeof vi.fn>
  let isAllowedIncognitoAccess: ReturnType<typeof vi.fn>
  const originalChrome = { ...chrome }

  beforeEach(() => {
    let nextTabId = 10
    const tabUrls = new Map<number, string>()
    tabsCreate = vi.fn(async ({ url }: { url: string }) => {
      const id = nextTabId++
      tabUrls.set(id, url)
      return { id }
    })
    tabsRemove = vi.fn(async () => {})
    windowsCreate = vi.fn(async () => ({
      id: INCOGNITO_WINDOW_ID,
      incognito: true,
      tabs: [{ id: INITIAL_TAB_ID }],
    }))
    windowsGetAll = vi.fn(async () => [{ id: CURRENT_WINDOW_ID }])
    isAllowedIncognitoAccess = vi.fn(async () => true)

    Object.assign(chrome, {
      tabs: {
        ...originalChrome.tabs,
        create: tabsCreate,
        remove: tabsRemove,
        get: vi.fn(async () => ({ status: "complete" })),
      },
      windows: {
        ...originalChrome.windows,
        create: windowsCreate,
        getAll: windowsGetAll,
        getCurrent: vi.fn(async () => ({ id: CURRENT_WINDOW_ID })),
      },
      extension: { isAllowedIncognitoAccess },
    })

    // Gemini passes, ChatGPT fails.
    mockSendTab.mockImplementation(async (tabId: number) => {
      const isGemini = tabUrls.get(tabId) === "https://gemini.example"
      return {
        id: isGemini ? "gemini" : "chatgpt",
        name: isGemini ? "Gemini" : "ChatGPT",
        url: tabUrls.get(tabId),
        pageState: "ok",
        groups: [
          {
            kind: SELECTOR_KIND.INPUT,
            matches: [{ selector: "#in", found: isGemini }],
          },
        ],
        verdict: isGemini ? VERDICT.PASS : VERDICT.FAIL,
      }
    })

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(services))),
    )
    for (const method of [
      "log",
      "info",
      "warn",
      "error",
      "table",
      "group",
      "groupCollapsed",
      "groupEnd",
    ] as const) {
      vi.spyOn(console, method).mockImplementation(() => {})
    }
  })

  afterEach(() => {
    Object.assign(chrome, originalChrome)
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("checks in the current window and closes only the passed tabs", async () => {
    await runAiSelectorCheck()

    expect(windowsCreate).not.toHaveBeenCalled()
    expect(tabsCreate).toHaveBeenCalledTimes(2)
    for (const [arg] of tabsCreate.mock.calls) {
      expect(arg).toMatchObject({ windowId: CURRENT_WINDOW_ID, active: false })
    }
    // Tab 10 is Gemini (passed); ChatGPT's tab is left open.
    expect(tabsRemove).toHaveBeenCalledWith([10])
  })

  describe("incognito", () => {
    it("checks in a new incognito window and closes its initial tab", async () => {
      await runAiSelectorCheck({ incognito: true })

      expect(windowsCreate).toHaveBeenCalledWith({
        incognito: true,
        focused: false,
      })
      for (const [arg] of tabsCreate.mock.calls) {
        expect(arg).toMatchObject({ windowId: INCOGNITO_WINDOW_ID })
      }
      expect(tabsRemove).toHaveBeenCalledWith([10, INITIAL_TAB_ID])
    })

    it("does nothing but log an error when not allowed in incognito", async () => {
      isAllowedIncognitoAccess.mockResolvedValue(false)

      await runAiSelectorCheck({ incognito: true })

      expect(windowsCreate).not.toHaveBeenCalled()
      expect(tabsCreate).not.toHaveBeenCalled()
      expect(console.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining("Allow in Incognito"),
      )
    })

    it("warns when other incognito windows share the session", async () => {
      windowsGetAll.mockResolvedValue([
        { id: CURRENT_WINDOW_ID },
        { id: 3, incognito: true },
      ])

      await runAiSelectorCheck({ incognito: true })

      expect(console.warn).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining("Other incognito windows are open"),
      )
      expect(windowsCreate).toHaveBeenCalled()
    })
  })
})
