import { beforeEach, describe, expect, it, vi } from "vitest"
import { openOptionPage } from "../chrome"

vi.mock("../offscreenClipboard", () => ({ readOffscreenClipboard: vi.fn() }))

const BASE_URL = "chrome-extension://test-extension-id/"
const OPTION_URL = `${BASE_URL}src/options_page.html`

/**
 * Mock chrome.tabs.query to return all tabs, or the active tab of the last
 * focused window when queried with `active: true`.
 */
const mockTabs = (tabs: Partial<chrome.tabs.Tab>[], currentWindowId = 1) => {
  vi.mocked(chrome.tabs.query).mockImplementation(((
    info: chrome.tabs.QueryInfo,
  ) =>
    Promise.resolve(
      info.active
        ? [{ id: 100, windowId: currentWindowId, url: "https://example.com/" }]
        : tabs,
    )) as typeof chrome.tabs.query)
}

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
    mockTabs([{ id: 1, windowId: 1, url: "https://example.com/" }])

    const result = await openOptionPage()

    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: "src/options_page.html",
    })
    expect(chrome.tabs.update).not.toHaveBeenCalled()
    expect(result).toEqual({ tab: { id: 20 }, created: true })
  })

  it("COP-02: activates the existing tab without navigating", async () => {
    mockTabs([{ id: 5, windowId: 2, url: `${OPTION_URL}#commands` }])

    const result = await openOptionPage()

    expect(chrome.tabs.create).not.toHaveBeenCalled()
    expect(chrome.tabs.update).toHaveBeenCalledWith(5, { active: true })
    expect(chrome.windows.update).toHaveBeenCalledWith(2, { focused: true })
    expect(result).toEqual({ tab: { id: 5 }, created: false })
  })

  it("COP-03: navigates the existing tab when a query is given", async () => {
    mockTabs([{ id: 5, windowId: 2, url: OPTION_URL }])

    await openOptionPage("src/options_page.html?addPageRule=x#pageRules")

    expect(chrome.tabs.create).not.toHaveBeenCalled()
    expect(chrome.tabs.update).toHaveBeenCalledWith(5, {
      active: true,
      url: `${OPTION_URL}?addPageRule=x#pageRules`,
    })
    expect(chrome.windows.update).toHaveBeenCalledWith(2, { focused: true })
  })

  it("COP-04: prefers the tab in the last focused window", async () => {
    mockTabs(
      [
        { id: 5, windowId: 2, url: OPTION_URL },
        { id: 6, windowId: 3, url: OPTION_URL },
      ],
      3,
    )

    await openOptionPage()

    expect(chrome.tabs.update).toHaveBeenCalledWith(6, { active: true })
    expect(chrome.windows.update).toHaveBeenCalledWith(3, { focused: true })
  })

  it("COP-05: reuses a tab that is still loading the options page", async () => {
    mockTabs([{ id: 5, windowId: 1, url: "", pendingUrl: OPTION_URL }])

    await openOptionPage()

    expect(chrome.tabs.create).not.toHaveBeenCalled()
    expect(chrome.tabs.update).toHaveBeenCalledWith(5, { active: true })
  })

  it("COP-06: does not reuse the excluded tab", async () => {
    mockTabs([{ id: 5, windowId: 1, url: OPTION_URL }])

    const result = await openOptionPage(undefined, 5)

    expect(chrome.tabs.update).not.toHaveBeenCalled()
    expect(result).toEqual({ tab: { id: 20 }, created: true })
  })
})
