import { describe, it, expect, vi, beforeEach } from "vitest"
import { OPEN_MODE } from "@/const"
import { calcContentHash } from "@/services/hub/commandContent"

const { mockStorage, mockSettings, mockGetAiServices } = vi.hoisted(() => ({
  mockStorage: { get: vi.fn(), set: vi.fn(), getCommands: vi.fn() },
  mockSettings: { updateCommands: vi.fn() },
  mockGetAiServices: vi.fn(),
}))

vi.mock("@/services/storage", () => ({
  Storage: mockStorage,
  LOCAL_STORAGE_KEY: { CACHES: "caches" },
}))
vi.mock("@/services/settings/settings", () => ({ Settings: mockSettings }))
vi.mock("@/services/aiPrompt", () => ({ getAiServices: mockGetAiServices }))

import { syncAiPromptFavicons } from "../aiPromptFaviconSync"

const OLD_URL = "https://chatgpt.com/favicon.ico"
const NEW_URL = "https://chatgpt.com/cdn/assets/favicon.svg"

const aiCommand = (iconUrl: string, serviceId = "chatgpt") => ({
  id: "cmd-1",
  title: "Ask",
  iconUrl,
  openMode: OPEN_MODE.AI_PROMPT,
  aiPromptOption: { serviceId, prompt: "{{SelectedText}}" },
})

const imageResponse = (contentType = "image/svg+xml") =>
  new Response(new Uint8Array([97, 98, 99]), {
    headers: { "content-type": contentType },
  })

const status = (code: number) => new Response(null, { status: code })

/** Answers each URL in the map, and an image for anything else. */
const respondWith = (responses: Record<string, () => Promise<Response>>) => {
  vi.mocked(fetch).mockImplementation(async (url) =>
    responses[url as string] ? responses[url as string]() : imageResponse(),
  )
}

describe("syncAiPromptFavicons", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAiServices.mockResolvedValue([
      { id: "chatgpt", faviconUrl: NEW_URL },
    ])
    mockStorage.get.mockResolvedValue({ images: {} })
    vi.spyOn(console, "warn").mockImplementation(() => {})
    vi.stubGlobal("fetch", vi.fn())
    respondWith({})
  })

  it.each([404, 410])(
    "AFS-01: replaces an icon that answers %i",
    async (code) => {
      respondWith({ [OLD_URL]: async () => status(code) })
      mockStorage.getCommands.mockResolvedValue([aiCommand(OLD_URL)])

      await syncAiPromptFavicons()

      expect(mockSettings.updateCommands).toHaveBeenCalledWith([
        aiCommand(NEW_URL),
      ])
    },
  )

  it("AFS-02: keeps an icon that can still be loaded", async () => {
    mockStorage.getCommands.mockResolvedValue([
      aiCommand("https://example.com/my-icon.png"),
    ])

    await syncAiPromptFavicons()

    expect(mockSettings.updateCommands).not.toHaveBeenCalled()
  })

  it.each([
    ["the request fails", () => Promise.reject(new TypeError("offline"))],
    ["the server answers 500", async () => status(500)],
    ["the server answers 403", async () => status(403)],
  ])("AFS-03: keeps the icon when %s", async (_, respond) => {
    respondWith({ [OLD_URL]: respond })
    mockStorage.getCommands.mockResolvedValue([aiCommand(OLD_URL)])

    await syncAiPromptFavicons()

    expect(mockSettings.updateCommands).not.toHaveBeenCalled()
  })

  it("AFS-04: does not request an icon held as a data URL", async () => {
    mockStorage.getCommands.mockResolvedValue([
      aiCommand("data:image/png;base64,AAAA"),
    ])

    await syncAiPromptFavicons()

    expect(fetch).not.toHaveBeenCalled()
    expect(mockSettings.updateCommands).not.toHaveBeenCalled()
  })

  it("AFS-05: does not write a command already on the current favicon", async () => {
    mockStorage.getCommands.mockResolvedValue([aiCommand(NEW_URL)])

    await syncAiPromptFavicons()

    expect(mockSettings.updateCommands).not.toHaveBeenCalled()
  })

  it("AFS-06: keeps a command of a service that no longer exists", async () => {
    respondWith({ [OLD_URL]: async () => status(404) })
    mockStorage.getCommands.mockResolvedValue([aiCommand(OLD_URL, "removed")])

    await syncAiPromptFavicons()

    expect(fetch).not.toHaveBeenCalled()
    expect(mockSettings.updateCommands).not.toHaveBeenCalled()
  })

  it("AFS-07: ignores commands of other types", async () => {
    mockStorage.getCommands.mockResolvedValue([
      { id: "cmd-2", iconUrl: OLD_URL, openMode: OPEN_MODE.POPUP },
    ])

    await syncAiPromptFavicons()

    expect(fetch).not.toHaveBeenCalled()
  })

  it("AFS-08: an unedited Hub command does not start to count as edited", async () => {
    respondWith({ [OLD_URL]: async () => status(404) })
    const base = aiCommand(OLD_URL)
    const command = { ...base, contentHash: calcContentHash(base) }
    mockStorage.getCommands.mockResolvedValue([command])

    await syncAiPromptFavicons()

    const [[saved]] = mockSettings.updateCommands.mock.calls[0]
    expect(saved.iconUrl).toBe(NEW_URL)
    expect(saved.contentHash).toBe(calcContentHash(saved))
  })

  it("AFS-09: a locally edited Hub command keeps counting as edited", async () => {
    respondWith({ [OLD_URL]: async () => status(404) })
    const command = { ...aiCommand(OLD_URL), contentHash: "edited" }
    mockStorage.getCommands.mockResolvedValue([command])

    await syncAiPromptFavicons()

    const [[saved]] = mockSettings.updateCommands.mock.calls[0]
    expect(saved.iconUrl).toBe(NEW_URL)
    expect(saved.contentHash).toBe("edited")
  })

  it("AFS-10: caches the new icon before updating the command", async () => {
    respondWith({ [OLD_URL]: async () => status(404) })
    mockStorage.get.mockResolvedValue({ images: { other: "data:other" } })
    mockStorage.getCommands.mockResolvedValue([aiCommand(OLD_URL)])

    await syncAiPromptFavicons()

    expect(mockStorage.set).toHaveBeenCalledWith("caches", {
      images: {
        other: "data:other",
        [NEW_URL]: `data:image/svg+xml;base64,${btoa("abc")}`,
      },
    })
    expect(mockStorage.set.mock.invocationCallOrder[0]).toBeLessThan(
      mockSettings.updateCommands.mock.invocationCallOrder[0],
    )
  })

  it("AFS-11: caches an icon missing on this device even without an update", async () => {
    mockStorage.getCommands.mockResolvedValue([aiCommand(NEW_URL)])

    await syncAiPromptFavicons()

    expect(mockStorage.set).toHaveBeenCalled()
    expect(mockSettings.updateCommands).not.toHaveBeenCalled()
  })

  it("AFS-12: does not download an icon that is already cached", async () => {
    respondWith({ [OLD_URL]: async () => status(404) })
    mockStorage.get.mockResolvedValue({ images: { [NEW_URL]: "data:cached" } })
    mockStorage.getCommands.mockResolvedValue([aiCommand(OLD_URL)])

    await syncAiPromptFavicons()

    const requested = vi.mocked(fetch).mock.calls.map(([url]) => url)
    expect(requested).not.toContain(NEW_URL)
    expect(mockStorage.set).not.toHaveBeenCalled()
    expect(mockSettings.updateCommands).toHaveBeenCalled()
  })

  it.each([
    ["cannot be requested", () => Promise.reject(new TypeError("offline"))],
    ["answers an error", async () => status(404)],
    ["is not an image", async () => imageResponse("text/html")],
  ])("AFS-13: keeps the icon when the new one %s", async (_, respond) => {
    respondWith({ [OLD_URL]: async () => status(404), [NEW_URL]: respond })
    mockStorage.getCommands.mockResolvedValue([aiCommand(OLD_URL)])

    await syncAiPromptFavicons()

    expect(mockStorage.set).not.toHaveBeenCalled()
    expect(mockSettings.updateCommands).not.toHaveBeenCalled()
  })

  it("AFS-14: requests a URL shared by several commands only once", async () => {
    respondWith({ [OLD_URL]: async () => status(404) })
    mockStorage.getCommands.mockResolvedValue([
      aiCommand(OLD_URL),
      { ...aiCommand(OLD_URL), id: "cmd-3" },
    ])

    await syncAiPromptFavicons()

    const probes = vi.mocked(fetch).mock.calls.filter(([u]) => u === OLD_URL)
    expect(probes).toHaveLength(1)
    expect(mockSettings.updateCommands.mock.calls[0][0]).toHaveLength(2)
  })

  it("AFS-15: replaces an icon whose URL answers an HTML page", async () => {
    respondWith({ [OLD_URL]: async () => imageResponse("text/html") })
    mockStorage.getCommands.mockResolvedValue([aiCommand(OLD_URL)])

    await syncAiPromptFavicons()

    expect(mockSettings.updateCommands).toHaveBeenCalledWith([
      aiCommand(NEW_URL),
    ])
  })

  it.each(["application/octet-stream", "text/plain", ""])(
    "AFS-16: keeps an icon served as '%s'",
    async (contentType) => {
      respondWith({ [OLD_URL]: async () => imageResponse(contentType) })
      mockStorage.getCommands.mockResolvedValue([aiCommand(OLD_URL)])

      await syncAiPromptFavicons()

      expect(mockSettings.updateCommands).not.toHaveBeenCalled()
    },
  )

  it("AFS-17: keeps an edit made during the requests", async () => {
    respondWith({ [OLD_URL]: async () => status(404) })
    const edited = { ...aiCommand(OLD_URL), title: "Edited" }
    mockStorage.getCommands
      .mockResolvedValueOnce([aiCommand(OLD_URL)])
      .mockResolvedValueOnce([edited])

    await syncAiPromptFavicons()

    expect(mockSettings.updateCommands).toHaveBeenCalledWith([
      { ...edited, iconUrl: NEW_URL },
    ])
  })

  it("AFS-18: keeps an icon changed during the requests", async () => {
    respondWith({ [OLD_URL]: async () => status(404) })
    mockStorage.getCommands
      .mockResolvedValueOnce([aiCommand(OLD_URL)])
      .mockResolvedValueOnce([aiCommand("https://example.com/my-icon.png")])

    await syncAiPromptFavicons()

    expect(mockSettings.updateCommands).not.toHaveBeenCalled()
  })

  it("AFS-19: does not restore a command removed during the requests", async () => {
    respondWith({ [OLD_URL]: async () => status(404) })
    mockStorage.getCommands
      .mockResolvedValueOnce([aiCommand(OLD_URL)])
      .mockResolvedValueOnce([])

    await syncAiPromptFavicons()

    expect(mockSettings.updateCommands).not.toHaveBeenCalled()
  })

  it("AFS-20: keeps cache changes made during the downloads", async () => {
    respondWith({ [OLD_URL]: async () => status(404) })
    mockStorage.get
      .mockResolvedValueOnce({ images: {} })
      .mockResolvedValueOnce({ images: { added: "data:added" }, other: 1 })
    mockStorage.getCommands.mockResolvedValue([aiCommand(OLD_URL)])

    await syncAiPromptFavicons()

    expect(mockStorage.set).toHaveBeenCalledWith("caches", {
      images: {
        added: "data:added",
        [NEW_URL]: `data:image/svg+xml;base64,${btoa("abc")}`,
      },
      other: 1,
    })
  })

  it("AFS-21: sets a timeout on every request", async () => {
    respondWith({ [OLD_URL]: async () => status(404) })
    mockStorage.getCommands.mockResolvedValue([aiCommand(OLD_URL)])

    await syncAiPromptFavicons()

    const calls = vi.mocked(fetch).mock.calls
    expect(calls.map(([url]) => url)).toEqual([OLD_URL, NEW_URL])
    for (const [, init] of calls) {
      expect(init?.signal).toBeInstanceOf(AbortSignal)
    }
  })

  it("AFS-22: a request that times out keeps the icon", async () => {
    respondWith({
      [OLD_URL]: () =>
        Promise.reject(new DOMException("Timed out", "TimeoutError")),
    })
    mockStorage.getCommands.mockResolvedValue([aiCommand(OLD_URL)])

    await syncAiPromptFavicons()

    expect(mockSettings.updateCommands).not.toHaveBeenCalled()
  })
})
