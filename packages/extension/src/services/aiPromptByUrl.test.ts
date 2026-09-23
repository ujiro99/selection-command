import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockStorage } = vi.hoisted(() => ({
  mockStorage: { get: vi.fn(), set: vi.fn() },
}))

vi.mock("@/services/storage", () => ({
  Storage: mockStorage,
  LOCAL_STORAGE_KEY: { CACHES: "caches" },
}))

import { findAiServiceByUrl } from "./aiPrompt"

const services = [
  { id: "chatgpt", name: "ChatGPT", url: "https://chatgpt.com" },
  { id: "gemini", name: "Gemini", url: "https://gemini.google.com/app" },
]

describe("findAiServiceByUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Served from today's cache so no network request is attempted.
    mockStorage.get.mockResolvedValue({
      aiServices: { date: new Date().toISOString().slice(0, 10), services },
    })
  })

  it("AU-01: matches a service by exact url", async () => {
    const found = await findAiServiceByUrl("https://chatgpt.com")
    expect(found?.id).toBe("chatgpt")
  })

  it("AU-02: matches any page within the same origin", async () => {
    const found = await findAiServiceByUrl("https://chatgpt.com/c/abc123?x=1")
    expect(found?.id).toBe("chatgpt")
  })

  it("AU-03: matches a service whose url carries a path", async () => {
    const found = await findAiServiceByUrl("https://gemini.google.com/")
    expect(found?.id).toBe("gemini")
  })

  it("AU-04: returns undefined for an unrelated site", async () => {
    expect(await findAiServiceByUrl("https://example.com")).toBeUndefined()
  })

  it("AU-05: does not match a different subdomain", async () => {
    expect(
      await findAiServiceByUrl("https://evil.chatgpt.com.attacker.test"),
    ).toBeUndefined()
  })

  it("AU-06: returns undefined for a malformed url", async () => {
    expect(await findAiServiceByUrl("not a url")).toBeUndefined()
    expect(await findAiServiceByUrl("")).toBeUndefined()
  })
})
