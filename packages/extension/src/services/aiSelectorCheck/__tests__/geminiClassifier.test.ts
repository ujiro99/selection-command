import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { classifyResult } from "../geminiClassifier"
import { PAGE_STATE, type PageSnapshot } from "../pageState"
import { SELECTOR_KIND, VERDICT, type ServiceCheckResult } from "../result"

const snapshot: PageSnapshot = {
  url: "https://chatgpt.com/",
  title: "ChatGPT",
  text: "Log in to continue",
}

// A result whose input was not found, as returned by the DOM checker.
const result: ServiceCheckResult = {
  id: "chatgpt",
  name: "ChatGPT",
  url: "https://chatgpt.com",
  groups: [
    {
      kind: SELECTOR_KIND.INPUT,
      matches: [{ selector: "#prompt", found: false }],
    },
  ],
  verdict: VERDICT.BLOCKED,
  pageState: PAGE_STATE.UNCLASSIFIED,
  snapshot,
}

const geminiResponse = (json: unknown) =>
  new Response(
    JSON.stringify({
      candidates: [{ content: { parts: [{ text: JSON.stringify(json) }] } }],
    }),
    { status: 200 },
  )

describe("classifyResult", () => {
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

  it("returns a result without a snapshot as is", async () => {
    const withoutSnapshot = { ...result, snapshot: undefined }

    expect(await classifyResult(withoutSnapshot)).toBe(withoutSnapshot)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("leaves the page unclassified without an API key", async () => {
    const ret = await classifyResult(result)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(ret.classification).toEqual({
      state: PAGE_STATE.UNCLASSIFIED,
      reason: "no Gemini API key",
    })
    // Treated like blocked: no issue is created for an unknown page.
    expect(ret.verdict).toBe(VERDICT.BLOCKED)
  })

  describe("with an API key", () => {
    it("classifies with Gemini and updates the verdict", async () => {
      fetchMock.mockResolvedValue(
        geminiResponse({
          state: "login_required",
          confidence: 0.9,
          reason: "login wall",
        }),
      )

      const ret = await classifyResult(result, {
        apiKey: "key",
        screenshot: { mimeType: "image/png", data: "AAAA" },
      })

      expect(ret.classification).toEqual({
        state: PAGE_STATE.LOGIN_REQUIRED,
        reason: "login wall",
        confidence: 0.9,
      })
      expect(ret.verdict).toBe(VERDICT.BLOCKED)
    })

    it("reports a broken selector when Gemini sees the normal chat UI", async () => {
      fetchMock.mockResolvedValue(
        geminiResponse({ state: "ok", confidence: 1, reason: "chat UI" }),
      )

      const ret = await classifyResult(result, { apiKey: "key" })

      expect(ret.pageState).toBe(PAGE_STATE.OK)
      expect(ret.verdict).toBe(VERDICT.FAIL)
    })

    it("sends the snapshot and the screenshot to the Gemini API", async () => {
      fetchMock.mockResolvedValue(
        geminiResponse({ state: "ok", confidence: 1, reason: "chat UI" }),
      )

      await classifyResult(result, {
        apiKey: "key",
        screenshot: { mimeType: "image/png", data: "AAAA" },
      })

      const [url, init] = fetchMock.mock.calls[0]
      expect(url).toMatch(
        /^https:\/\/generativelanguage\.googleapis\.com\/.+:generateContent$/,
      )
      expect(init.headers["x-goog-api-key"]).toBe("key")
      const body = JSON.parse(init.body)
      expect(body.contents[0].parts[0].text).toContain("Log in to continue")
      expect(body.contents[0].parts[1]).toEqual({
        inline_data: { mime_type: "image/png", data: "AAAA" },
      })
    })

    it("leaves the page unclassified when the API fails", async () => {
      fetchMock.mockResolvedValue(new Response("quota", { status: 429 }))

      const ret = await classifyResult(result, { apiKey: "key" })

      expect(ret.pageState).toBe(PAGE_STATE.UNCLASSIFIED)
      expect(ret.classification?.reason).toMatch(/^Gemini API failed: .*429/)
      expect(ret.verdict).toBe(VERDICT.BLOCKED)
    })

    it.each(["maybe", PAGE_STATE.UNCLASSIFIED])(
      "leaves the page unclassified when Gemini returns '%s'",
      async (state) => {
        fetchMock.mockResolvedValue(
          geminiResponse({ state, confidence: 1, reason: "" }),
        )

        const ret = await classifyResult(result, { apiKey: "key" })

        expect(ret.pageState).toBe(PAGE_STATE.UNCLASSIFIED)
        expect(ret.classification?.reason).toMatch(/^Gemini API failed/)
      },
    )
  })
})
