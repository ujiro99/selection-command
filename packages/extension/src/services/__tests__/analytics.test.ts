import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { OPEN_MODE } from "@/const"
import { Storage } from "@/services/storage"
import {
  ANALYTICS_EVENTS,
  getCommandCreateEvent,
  getHubAddEvent,
  getOrCreateClientId,
  getBrowserEnvironmentParams,
  toErrorMessageParam,
} from "@/services/analytics"

vi.mock("@/services/storage", () => ({
  Storage: { get: vi.fn(), set: vi.fn() },
  LOCAL_STORAGE_KEY: { CLIENT_ID: "clientId", HUB_USER: "hubUser" },
  SESSION_STORAGE_KEY: { SESSION_DATA: "sessionData" },
}))

describe("getCommandCreateEvent", () => {
  it.each([
    [OPEN_MODE.POPUP, ANALYTICS_EVENTS.COMMAND_CREATE_SEARCH],
    [OPEN_MODE.WINDOW, ANALYTICS_EVENTS.COMMAND_CREATE_SEARCH],
    [OPEN_MODE.TAB, ANALYTICS_EVENTS.COMMAND_CREATE_SEARCH],
    [OPEN_MODE.BACKGROUND_TAB, ANALYTICS_EVENTS.COMMAND_CREATE_SEARCH],
    [OPEN_MODE.SIDE_PANEL, ANALYTICS_EVENTS.COMMAND_CREATE_SEARCH],
    [OPEN_MODE.AI_PROMPT, ANALYTICS_EVENTS.COMMAND_CREATE_AIPROMPT],
    [OPEN_MODE.API, ANALYTICS_EVENTS.COMMAND_CREATE_OTHER],
    [OPEN_MODE.PAGE_ACTION, ANALYTICS_EVENTS.COMMAND_CREATE_OTHER],
    [OPEN_MODE.LINK_POPUP, ANALYTICS_EVENTS.COMMAND_CREATE_OTHER],
    [OPEN_MODE.COPY, ANALYTICS_EVENTS.COMMAND_CREATE_OTHER],
    [OPEN_MODE.GET_TEXT_STYLES, ANALYTICS_EVENTS.COMMAND_CREATE_OTHER],
    [OPEN_MODE.OPTION, ANALYTICS_EVENTS.COMMAND_CREATE_OTHER],
    [OPEN_MODE.ADD_PAGE_RULE, ANALYTICS_EVENTS.COMMAND_CREATE_OTHER],
  ] as const)("maps openMode %s to %s", (openMode, expected) => {
    expect(getCommandCreateEvent(openMode)).toBe(expected)
  })
})

describe("ANALYTICS_EVENTS onboarding events", () => {
  it("defines the event names used by the onboarding flow", () => {
    expect(ANALYTICS_EVENTS.ONBOARDING_START).toBe("onboarding_start")
    expect(ANALYTICS_EVENTS.ONBOARDING_SKIP).toBe("onboarding_skip")
    expect(ANALYTICS_EVENTS.ONBOARDING_TEXT_SELECTION).toBe(
      "onboarding_text_selection",
    )
    expect(ANALYTICS_EVENTS.ONBOARDING_COMMAND_EXECUTE).toBe(
      "onboarding_command_execute",
    )
    expect(ANALYTICS_EVENTS.ONBOARDING_VALUE_REACHED).toBe(
      "onboarding_value_reached",
    )
    expect(ANALYTICS_EVENTS.ONBOARDING_COMPLETE).toBe("onboarding_complete")
  })
})

describe("getHubAddEvent", () => {
  it.each([
    [OPEN_MODE.POPUP, ANALYTICS_EVENTS.HUB_ADD_SEARCH],
    [OPEN_MODE.WINDOW, ANALYTICS_EVENTS.HUB_ADD_SEARCH],
    [OPEN_MODE.TAB, ANALYTICS_EVENTS.HUB_ADD_SEARCH],
    [OPEN_MODE.BACKGROUND_TAB, ANALYTICS_EVENTS.HUB_ADD_SEARCH],
    [OPEN_MODE.SIDE_PANEL, ANALYTICS_EVENTS.HUB_ADD_SEARCH],
    [OPEN_MODE.AI_PROMPT, ANALYTICS_EVENTS.HUB_ADD_AIPROMPT],
    [OPEN_MODE.API, ANALYTICS_EVENTS.HUB_ADD_OTHER],
    [OPEN_MODE.PAGE_ACTION, ANALYTICS_EVENTS.HUB_ADD_OTHER],
    [OPEN_MODE.LINK_POPUP, ANALYTICS_EVENTS.HUB_ADD_OTHER],
    [OPEN_MODE.COPY, ANALYTICS_EVENTS.HUB_ADD_OTHER],
    [OPEN_MODE.GET_TEXT_STYLES, ANALYTICS_EVENTS.HUB_ADD_OTHER],
    [OPEN_MODE.OPTION, ANALYTICS_EVENTS.HUB_ADD_OTHER],
    [OPEN_MODE.ADD_PAGE_RULE, ANALYTICS_EVENTS.HUB_ADD_OTHER],
  ] as const)("maps openMode %s to %s", (openMode, expected) => {
    expect(getHubAddEvent(openMode)).toBe(expected)
  })
})

describe("getOrCreateClientId", () => {
  beforeEach(() => {
    vi.mocked(Storage.get).mockReset()
    vi.mocked(Storage.set).mockReset()
  })

  it("returns the stored client_id without generating a new one", async () => {
    vi.mocked(Storage.get).mockResolvedValue("stored-id")

    await expect(getOrCreateClientId()).resolves.toBe("stored-id")
    expect(Storage.set).not.toHaveBeenCalled()
  })

  it("generates a single client_id for concurrent callers", async () => {
    vi.mocked(Storage.get).mockResolvedValue("")

    const ids = await Promise.all([
      getOrCreateClientId(),
      getOrCreateClientId(),
      getOrCreateClientId(),
    ])

    expect(new Set(ids).size).toBe(1)
    expect(Storage.set).toHaveBeenCalledTimes(1)
    expect(Storage.set).toHaveBeenCalledWith("clientId", ids[0])
  })

  it("retries after a failed attempt instead of caching the failure", async () => {
    vi.mocked(Storage.get)
      .mockRejectedValueOnce(new Error("storage error"))
      .mockResolvedValueOnce("stored-id")

    await expect(getOrCreateClientId()).rejects.toThrow("storage error")
    await expect(getOrCreateClientId()).resolves.toBe("stored-id")
  })
})

describe("getBrowserEnvironmentParams", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("reports brands without GREASE entries and the webdriver flag", () => {
    vi.stubGlobal("navigator", {
      webdriver: true,
      userAgentData: {
        brands: [
          { brand: "Not A(Brand", version: "8" },
          { brand: "Chromium", version: "141" },
          { brand: "Opera", version: "136" },
        ],
      },
    })

    expect(getBrowserEnvironmentParams()).toEqual({
      browser_brands: "Chromium/141,Opera/136",
      is_webdriver: "true",
    })
  })

  it("falls back to unknown when the browser does not expose them", () => {
    vi.stubGlobal("navigator", {})

    expect(getBrowserEnvironmentParams()).toEqual({
      browser_brands: "unknown",
      is_webdriver: "unknown",
    })
  })
})

describe("toErrorMessageParam", () => {
  it("uses the message of an Error", () => {
    expect(toErrorMessageParam(new Error("boom"))).toBe("boom")
  })

  it("masks URLs such as page addresses and extension paths", () => {
    expect(
      toErrorMessageParam(
        new Error(
          "Failed at chrome-extension://abcdef/src/app.js and https://example.com/a?b=c",
        ),
      ),
    ).toBe("Failed at <url> and <url>")
  })

  it("truncates to the GA4 parameter length limit", () => {
    expect(toErrorMessageParam("x".repeat(150))).toHaveLength(100)
  })
})
