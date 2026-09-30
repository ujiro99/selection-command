import { describe, it, expect } from "vitest"
import {
  detectPageStateByRules,
  PAGE_STATE,
  takePageSnapshot,
} from "../pageState"

const snapshot = (
  overrides: Partial<Parameters<typeof detectPageStateByRules>[0]>,
) => ({
  url: "https://chatgpt.com/",
  title: "ChatGPT",
  hasChallengeElement: false,
  text: "",
  ...overrides,
})

describe("takePageSnapshot", () => {
  it("collects url, title, challenge marker and normalized text", () => {
    document.title = "Just a moment..."
    document.body.innerHTML = `<form id="challenge-form"></form><p>Verify   you\n are human</p>`
    // jsdom does not implement innerText.
    Object.defineProperty(document.body, "innerText", {
      value: "Verify   you\n are human",
      configurable: true,
    })

    const snapshot = takePageSnapshot({
      challengeSelectors: ["#challenge-form", "invalid[["],
      textLength: 10,
    })

    expect(snapshot).toEqual({
      url: location.href,
      title: "Just a moment...",
      hasChallengeElement: true,
      text: "Verify you",
    })
  })
})

describe("detectPageStateByRules", () => {
  it("returns ok for a normal page", () => {
    expect(detectPageStateByRules(snapshot({}))).toBe(PAGE_STATE.OK)
  })

  it("returns blocked when a challenge element exists", () => {
    expect(
      detectPageStateByRules(snapshot({ hasChallengeElement: true })),
    ).toBe(PAGE_STATE.BLOCKED)
  })

  it.each(["Just a moment...", "Attention Required! | Cloudflare"])(
    "returns blocked for challenge title '%s'",
    (title) => {
      expect(detectPageStateByRules(snapshot({ title }))).toBe(
        PAGE_STATE.BLOCKED,
      )
    },
  )

  it("returns blocked for Google's unusual traffic page", () => {
    expect(
      detectPageStateByRules(
        snapshot({ url: "https://www.google.com/sorry/index" }),
      ),
    ).toBe(PAGE_STATE.BLOCKED)
  })

  it.each([
    "https://accounts.google.com/v3/signin/identifier",
    "https://auth.openai.com/log-in",
    "https://claude.ai/login?returnTo=%2Fnew",
  ])("returns login_required for '%s'", (url) => {
    expect(detectPageStateByRules(snapshot({ url }))).toBe(
      PAGE_STATE.LOGIN_REQUIRED,
    )
  })

  it("does not treat paths merely starting with 'login' words as login pages", () => {
    expect(
      detectPageStateByRules(
        snapshot({ url: "https://example.com/loginless-mode" }),
      ),
    ).toBe(PAGE_STATE.OK)
  })

  it("prefers blocked over login_required", () => {
    expect(
      detectPageStateByRules(
        snapshot({ url: "https://claude.ai/login", hasChallengeElement: true }),
      ),
    ).toBe(PAGE_STATE.BLOCKED)
  })
})
