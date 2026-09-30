import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  classifyPage,
  classifyResult,
  GEMINI_API_URL,
} from "../geminiClassifier"
import { PAGE_STATE, type PageSnapshot } from "../pageState"
import { SELECTOR_KIND, VERDICT, type ServiceCheckResult } from "../result"

const snapshot: PageSnapshot = {
  url: "https://chatgpt.com/",
  title: "ChatGPT",
  hasChallengeElement: false,
  text: "Log in to continue",
}

const geminiResponse = (json: unknown) =>
  new Response(
    JSON.stringify({
      candidates: [{ content: { parts: [{ text: JSON.stringify(json) }] } }],
    }),
    { status: 200 },
  )

describe("classifyPage", () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    vi.spyOn(console, "warn").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("uses the rules without an API key", async () => {
    const ret = await classifyPage(snapshot)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(ret).toEqual({
      state: PAGE_STATE.OK,
      reason: "no Gemini API key",
      classifiedBy: "rules",
    })
  })

  it("uses Gemini with an API key", async () => {
    fetchMock.mockResolvedValue(
      geminiResponse({
        state: "login_required",
        confidence: 0.9,
        reason: "login wall",
      }),
    )

    const ret = await classifyPage(snapshot, {
      apiKey: "key",
      screenshot: { mimeType: "image/png", data: "AAAA" },
    })

    expect(ret).toEqual({
      state: PAGE_STATE.LOGIN_REQUIRED,
      reason: "login wall",
      confidence: 0.9,
      classifiedBy: "gemini",
    })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(GEMINI_API_URL)
    expect(init.headers["x-goog-api-key"]).toBe("key")
    const body = JSON.parse(init.body)
    expect(body.contents[0].parts[0].text).toContain("Log in to continue")
    expect(body.contents[0].parts[1]).toEqual({
      inline_data: { mime_type: "image/png", data: "AAAA" },
    })
  })

  it("falls back to the rules when the API fails", async () => {
    fetchMock.mockResolvedValue(new Response("quota", { status: 429 }))

    const ret = await classifyPage(
      { ...snapshot, hasChallengeElement: true },
      { apiKey: "key" },
    )

    expect(ret.state).toBe(PAGE_STATE.BLOCKED)
    expect(ret.classifiedBy).toBe("rules")
  })

  it("falls back to the rules on an unknown state", async () => {
    fetchMock.mockResolvedValue(
      geminiResponse({ state: "maybe", confidence: 1, reason: "" }),
    )

    const ret = await classifyPage(snapshot, { apiKey: "key" })

    expect(ret.classifiedBy).toBe("rules")
  })
})

describe("classifyResult", () => {
  const base: ServiceCheckResult = {
    id: "chatgpt",
    name: "ChatGPT",
    url: "https://chatgpt.com",
    groups: [
      {
        kind: SELECTOR_KIND.INPUT,
        matches: [{ selector: "#prompt", found: false }],
      },
    ],
    verdict: VERDICT.FAIL,
    pageState: PAGE_STATE.OK,
  }

  it("returns a result without a snapshot as is", async () => {
    expect(await classifyResult(base)).toBe(base)
  })

  it("updates the verdict from the classification", async () => {
    const ret = await classifyResult({
      ...base,
      snapshot: { ...snapshot, title: "Just a moment..." },
    })

    expect(ret.pageState).toBe(PAGE_STATE.BLOCKED)
    expect(ret.verdict).toBe(VERDICT.BLOCKED)
    expect(ret.classification?.classifiedBy).toBe("rules")
  })
})
