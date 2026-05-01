import { describe, it, expect } from "vitest"
import { normalizeServices, AI_SERVICES_FALLBACK } from "./aiPromptFallback"

describe("normalizeServices", () => {
  it("NS-01: should normalize a service with inputSelectors and submitSelectors", () => {
    const raw = [
      {
        id: "gemini",
        name: "Gemini",
        url: "https://gemini.google.com/app",
        faviconUrl: "https://example.com/favicon.ico",
        inputSelectors: [".input"],
        submitSelectors: ["button.send"],
      },
    ]
    const result = normalizeServices(raw)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("gemini")
    expect(result[0].queryUrl).toBeUndefined()
    expect(result[0].autoSubmit).toBeUndefined()
  })

  it("NS-02: should normalize a service with queryUrl only (no selectors required)", () => {
    const raw = [
      {
        id: "perplexity",
        name: "Perplexity",
        url: "https://www.perplexity.ai",
        faviconUrl: "",
        queryUrl: "https://www.perplexity.ai/search/new?q=%s",
        autoSubmit: true,
      },
    ]
    const result = normalizeServices(raw)
    expect(result).toHaveLength(1)
    expect(result[0].queryUrl).toBe("https://www.perplexity.ai/search/new?q=%s")
    expect(result[0].autoSubmit).toBe(true)
    expect(result[0].inputSelectors).toEqual([])
    expect(result[0].submitSelectors).toEqual([])
  })

  it("NS-03: should normalize a service with both queryUrl and selectors", () => {
    const raw = [
      {
        id: "chatgpt",
        name: "ChatGPT",
        url: "https://chatgpt.com",
        faviconUrl: "",
        queryUrl: "https://chatgpt.com/?prompt=%s",
        autoSubmit: false,
        inputSelectors: ["#prompt-textarea"],
        submitSelectors: ["button#submit"],
      },
    ]
    const result = normalizeServices(raw)
    expect(result).toHaveLength(1)
    expect(result[0].queryUrl).toBe("https://chatgpt.com/?prompt=%s")
    expect(result[0].autoSubmit).toBe(false)
    expect(result[0].inputSelectors).toEqual(["#prompt-textarea"])
    expect(result[0].submitSelectors).toEqual(["button#submit"])
  })

  it("NS-04: should skip entries missing both queryUrl and selectors", () => {
    const raw = [
      {
        id: "invalid",
        url: "https://example.com",
        // no queryUrl, no inputSelectors/submitSelectors
      },
    ]
    const result = normalizeServices(raw)
    expect(result).toHaveLength(0)
  })

  it("NS-05: should skip entries missing id or url", () => {
    const raw = [
      { url: "https://example.com", inputSelectors: [".x"], submitSelectors: [".y"] },
      { id: "test", inputSelectors: [".x"], submitSelectors: [".y"] },
    ]
    const result = normalizeServices(raw)
    expect(result).toHaveLength(0)
  })

  it("NS-06: should use id as name when name is missing", () => {
    const raw = [
      {
        id: "myservice",
        url: "https://example.com",
        queryUrl: "https://example.com/?q=%s",
      },
    ]
    const result = normalizeServices(raw)
    expect(result[0].name).toBe("myservice")
  })
})

describe("AI_SERVICES_FALLBACK", () => {
  it("AF-01: should include chatgpt with queryUrl", () => {
    const chatgpt = AI_SERVICES_FALLBACK.find((s) => s.id === "chatgpt")
    expect(chatgpt).toBeDefined()
    expect(chatgpt?.queryUrl).toBe("https://chatgpt.com/?prompt=%s")
    expect(chatgpt?.autoSubmit).toBe(false)
  })

  it("AF-02: should include claude with queryUrl", () => {
    const claude = AI_SERVICES_FALLBACK.find((s) => s.id === "claude")
    expect(claude).toBeDefined()
    expect(claude?.queryUrl).toBe("https://claude.ai/new?q=%s")
    expect(claude?.autoSubmit).toBe(false)
  })

  it("AF-03: should include perplexity with queryUrl and autoSubmit", () => {
    const perplexity = AI_SERVICES_FALLBACK.find((s) => s.id === "perplexity")
    expect(perplexity).toBeDefined()
    expect(perplexity?.queryUrl).toBe("https://www.perplexity.ai/search/new?q=%s")
    expect(perplexity?.autoSubmit).toBe(true)
  })

  it("AF-04: should include gemini without queryUrl", () => {
    const gemini = AI_SERVICES_FALLBACK.find((s) => s.id === "gemini")
    expect(gemini).toBeDefined()
    expect(gemini?.queryUrl).toBeUndefined()
  })
})
