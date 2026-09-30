import { describe, it, expect } from "vitest"
import { detectPageState, PAGE_STATE } from "../pageState"

const snapshot = (
  overrides: Partial<Parameters<typeof detectPageState>[0]>,
) => ({
  url: "https://chatgpt.com/",
  title: "ChatGPT",
  hasChallengeElement: false,
  ...overrides,
})

describe("detectPageState", () => {
  it("returns ok for a normal page", () => {
    expect(detectPageState(snapshot({}))).toBe(PAGE_STATE.OK)
  })

  it("returns blocked when a challenge element exists", () => {
    expect(detectPageState(snapshot({ hasChallengeElement: true }))).toBe(
      PAGE_STATE.BLOCKED,
    )
  })

  it.each(["Just a moment...", "Attention Required! | Cloudflare"])(
    "returns blocked for challenge title '%s'",
    (title) => {
      expect(detectPageState(snapshot({ title }))).toBe(PAGE_STATE.BLOCKED)
    },
  )

  it("returns blocked for Google's unusual traffic page", () => {
    expect(
      detectPageState(snapshot({ url: "https://www.google.com/sorry/index" })),
    ).toBe(PAGE_STATE.BLOCKED)
  })

  it.each([
    "https://accounts.google.com/v3/signin/identifier",
    "https://auth.openai.com/log-in",
    "https://claude.ai/login?returnTo=%2Fnew",
  ])("returns login_required for '%s'", (url) => {
    expect(detectPageState(snapshot({ url }))).toBe(PAGE_STATE.LOGIN_REQUIRED)
  })

  it("does not treat paths merely starting with 'login' words as login pages", () => {
    expect(
      detectPageState(snapshot({ url: "https://example.com/loginless-mode" })),
    ).toBe(PAGE_STATE.OK)
  })

  it("prefers blocked over login_required", () => {
    expect(
      detectPageState(
        snapshot({ url: "https://claude.ai/login", hasChallengeElement: true }),
      ),
    ).toBe(PAGE_STATE.BLOCKED)
  })
})
