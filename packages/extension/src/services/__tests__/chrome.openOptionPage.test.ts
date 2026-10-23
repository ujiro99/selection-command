import { beforeEach, describe, expect, it, vi } from "vitest"
import { openOptionPage } from "../chrome"

vi.mock("../offscreenClipboard", () => ({ readOffscreenClipboard: vi.fn() }))

const BASE_URL = "chrome-extension://test-extension-id/"
const OPTION_URL = `${BASE_URL}src/options_page.html`

describe("openOptionPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(chrome.runtime.getURL).mockImplementation(
      (path: string) => `${BASE_URL}${path}`,
    )
    vi.mocked(chrome.tabs.create).mockImplementation(() =>
      Promise.resolve({ id: 20 } as chrome.tabs.Tab),
    )
    vi.mocked(chrome.tabs.update).mockImplementation(
      async (tabId) => ({ id: tabId }) as chrome.tabs.Tab,
    )
    ;(chrome.windows as any).update = vi.fn().mockResolvedValue({})
  })

  it("COP-01: creates a new tab when no options page is open", async () => {
    vi.mocked(chrome.tabs.query).mockImplementation(() =>
      Promise.resolve([
        { id: 1, windowId: 1, url: "https://example.com/" },
      ] as chrome.tabs.Tab[]),
    )

    const result = await openOptionPage()

    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: "src/options_page.html",
    })
    expect(chrome.tabs.update).not.toHaveBeenCalled()
    expect(result).toEqual({ tab: { id: 20 }, created: true })
  })

  it("COP-02: activates the existing tab without navigating", async () => {
    vi.mocked(chrome.tabs.query).mockImplementation(() =>
      Promise.resolve([
        { id: 5, windowId: 2, url: `${OPTION_URL}#commands` },
      ] as chrome.tabs.Tab[]),
    )

    const result = await openOptionPage()

    expect(chrome.tabs.create).not.toHaveBeenCalled()
    expect(chrome.tabs.update).toHaveBeenCalledWith(5, { active: true })
    expect(chrome.windows.update).toHaveBeenCalledWith(2, { focused: true })
    expect(result).toEqual({ tab: { id: 5 }, created: false })
  })

  it("COP-03: navigates the existing tab when a query is given", async () => {
    vi.mocked(chrome.tabs.query).mockImplementation(() =>
      Promise.resolve([
        { id: 5, windowId: 2, url: OPTION_URL },
      ] as chrome.tabs.Tab[]),
    )

    await openOptionPage("src/options_page.html?addPageRule=x#pageRules")

    expect(chrome.tabs.create).not.toHaveBeenCalled()
    expect(chrome.tabs.update).toHaveBeenCalledWith(5, {
      active: true,
      url: `${OPTION_URL}?addPageRule=x#pageRules`,
    })
    expect(chrome.windows.update).toHaveBeenCalledWith(2, { focused: true })
  })
})
