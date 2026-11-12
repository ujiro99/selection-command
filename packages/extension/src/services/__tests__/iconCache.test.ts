import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockStorage } = vi.hoisted(() => ({
  mockStorage: { get: vi.fn(), set: vi.fn() },
}))

vi.mock("@/services/storage", () => ({
  Storage: mockStorage,
  LOCAL_STORAGE_KEY: { CACHES: "caches" },
}))

import { ensureIconsCached, fetchIconAsDataUrl } from "../iconCache"

const URL_A = "https://example.com/a.ico"
const URL_B = "https://example.com/b.ico"

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]
const JPEG = [0xff, 0xd8, 0xff, 0xe0]
const GIF = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]
const ICO = [0x00, 0x00, 0x01, 0x00, 0x01, 0x00]
const WEBP = [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]

const text = (str: string) => Array.from(new TextEncoder().encode(str))

const response = (bytes: number[], contentType: string, code = 200) =>
  new Response(new Uint8Array(bytes), {
    status: code,
    headers: { "content-type": contentType },
  })

const dataUrl = (bytes: number[], mimeType: string) =>
  `data:${mimeType};base64,${btoa(String.fromCharCode(...bytes))}`

describe("fetchIconAsDataUrl", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
  })

  it("ICN-01: keeps the original bytes with the declared type", async () => {
    vi.mocked(fetch).mockResolvedValue(response(PNG, "image/x-icon"))

    await expect(fetchIconAsDataUrl(URL_A)).resolves.toBe(
      dataUrl(PNG, "image/x-icon"),
    )
  })

  it("ICN-02: removes the parameters of the declared type", async () => {
    const svg = text("<svg></svg>")
    vi.mocked(fetch).mockResolvedValue(
      response(svg, "Image/SVG+xml; charset=utf-8"),
    )

    await expect(fetchIconAsDataUrl(URL_A)).resolves.toBe(
      dataUrl(svg, "image/svg+xml"),
    )
  })

  it.each([
    ["PNG", PNG, "image/png"],
    ["JPEG", JPEG, "image/jpeg"],
    ["GIF", GIF, "image/gif"],
    ["ICO", ICO, "image/x-icon"],
    ["WebP", WEBP, "image/webp"],
    ["SVG", text("<svg xmlns='x'></svg>"), "image/svg+xml"],
    [
      "SVG with a prolog",
      text(
        '<?xml version="1.0"?>\n<!-- c -->\n<!DOCTYPE svg PUBLIC "x" "y">\n<svg>',
      ),
      "image/svg+xml",
    ],
  ])(
    "ICN-03: detects %s served with an inaccurate type",
    async (_, bytes, mimeType) => {
      vi.mocked(fetch).mockResolvedValue(
        response(bytes, "application/octet-stream"),
      )

      await expect(fetchIconAsDataUrl(URL_A)).resolves.toBe(
        dataUrl(bytes, mimeType),
      )
    },
  )

  it.each([
    ["an HTML page", text("<!doctype html><html><svg></svg></html>")],
    ["unknown bytes", [1, 2, 3]],
    ["a truncated signature", [0x89, 0x50]],
  ])("ICN-04: rejects %s", async (_, bytes) => {
    vi.mocked(fetch).mockResolvedValue(response(bytes, "text/html"))

    await expect(fetchIconAsDataUrl(URL_A)).rejects.toThrow(
      "Unexpected content type: text/html",
    )
  })

  it("ICN-05: rejects an error status", async () => {
    vi.mocked(fetch).mockResolvedValue(response(PNG, "image/png", 403))

    await expect(fetchIconAsDataUrl(URL_A)).rejects.toThrow("HTTP 403")
  })

  it("ICN-06: rejects an empty response", async () => {
    vi.mocked(fetch).mockResolvedValue(response([], "image/png"))

    await expect(fetchIconAsDataUrl(URL_A)).rejects.toThrow("Empty response")
  })

  it("ICN-07: accepts up to the size limit and rejects beyond it", async () => {
    const limit = 512 * 1024
    vi.mocked(fetch).mockImplementation(async (url) =>
      response(
        new Array(url === URL_A ? limit : limit + 1).fill(0),
        "image/png",
      ),
    )

    await expect(fetchIconAsDataUrl(URL_A)).resolves.toMatch(/^data:image\/png/)
    await expect(fetchIconAsDataUrl(URL_B)).rejects.toThrow("Icon too large")
  })

  it("ICN-13: sniffs the bytes when the declared type has no subtype", async () => {
    vi.mocked(fetch).mockResolvedValue(response(PNG, "image/"))

    await expect(fetchIconAsDataUrl(URL_A)).resolves.toBe(
      dataUrl(PNG, "image/png"),
    )
  })

  it("ICN-14: detects an SVG that starts with a UTF-8 BOM", async () => {
    const svg = [0xef, 0xbb, 0xbf, ...text("<svg></svg>")]
    vi.mocked(fetch).mockResolvedValue(
      response(svg, "application/octet-stream"),
    )

    await expect(fetchIconAsDataUrl(URL_A)).resolves.toBe(
      dataUrl(svg, "image/svg+xml"),
    )
  })

  it("ICN-15: rejects a too large content-length without reading the body", async () => {
    const res = new Response(new Uint8Array(PNG), {
      headers: {
        "content-type": "image/png",
        "content-length": String(512 * 1024 + 1),
      },
    })
    const arrayBuffer = vi.spyOn(res, "arrayBuffer")
    const cancel = vi.spyOn(res.body!, "cancel")
    vi.mocked(fetch).mockResolvedValue(res)

    await expect(fetchIconAsDataUrl(URL_A)).rejects.toThrow("Icon too large")
    expect(arrayBuffer).not.toHaveBeenCalled()
    expect(cancel).toHaveBeenCalled()
  })

  it("ICN-16: stops reading a stream once it exceeds the size limit", async () => {
    const chunk = new Uint8Array(256 * 1024)
    let pulled = 0
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled++
        controller.enqueue(chunk)
      },
    })
    vi.mocked(fetch).mockResolvedValue(
      new Response(body, { headers: { "content-type": "image/png" } }),
    )

    await expect(fetchIconAsDataUrl(URL_A)).rejects.toThrow("Icon too large")
    // The endless stream is cancelled right after the limit is exceeded.
    expect(pulled).toBeLessThanOrEqual(4)
  })

  it.each(["image/x-icon", "image/svg+xml"])(
    "ICN-18: rejects an HTML page declared as %s",
    async (contentType) => {
      vi.mocked(fetch).mockResolvedValue(
        response(text("\n<!DOCTYPE html><html></html>"), contentType),
      )

      await expect(fetchIconAsDataUrl(URL_A)).rejects.toThrow(
        `HTML served as ${contentType}`,
      )
    },
  )

  it("ICN-08: applies the given timeout", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout")
    vi.mocked(fetch).mockResolvedValue(response(PNG, "image/png"))

    await fetchIconAsDataUrl(URL_A, 1234)

    expect(timeout).toHaveBeenCalledWith(1234)
    expect(vi.mocked(fetch).mock.calls[0][1]?.signal).toBe(
      timeout.mock.results[0].value,
    )
  })
})

describe("ensureIconsCached", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal("fetch", vi.fn())
    vi.spyOn(console, "warn").mockImplementation(() => {})
    mockStorage.get.mockResolvedValue({ images: {} })
    vi.mocked(fetch).mockImplementation(async () => response(PNG, "image/png"))
  })

  it("ICN-09: stores a missing icon and reports it as cached", async () => {
    const cached = await ensureIconsCached([URL_A])

    expect(cached).toEqual(new Set([URL_A]))
    expect(mockStorage.set).toHaveBeenCalledWith("caches", {
      images: { [URL_A]: dataUrl(PNG, "image/png") },
    })
  })

  it("ICN-10: does not download or write an icon already cached", async () => {
    mockStorage.get.mockResolvedValue({ images: { [URL_A]: "data:a" } })

    const cached = await ensureIconsCached([URL_A])

    expect(cached).toEqual(new Set([URL_A]))
    expect(fetch).not.toHaveBeenCalled()
    expect(mockStorage.set).not.toHaveBeenCalled()
  })

  it("ICN-11: a failed icon does not affect the others", async () => {
    vi.mocked(fetch).mockImplementation(async (url) =>
      url === URL_A ? response([], "image/png") : response(PNG, "image/png"),
    )

    const cached = await ensureIconsCached([URL_A, URL_B])

    expect(cached).toEqual(new Set([URL_B]))
    expect(mockStorage.set).toHaveBeenCalledWith("caches", {
      images: { [URL_B]: dataUrl(PNG, "image/png") },
    })
  })

  it("ICN-17: applies the given timeout to the downloads", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout")

    await ensureIconsCached([URL_A], 1234)

    expect(timeout).toHaveBeenCalledWith(1234)
  })

  it("ICN-19: reports an icon cached by another update during the downloads", async () => {
    mockStorage.get
      .mockResolvedValueOnce({ images: {} })
      .mockResolvedValueOnce({ images: { [URL_A]: "data:other" } })
    vi.mocked(fetch).mockImplementation(async (url) =>
      url === URL_A ? response([], "image/png") : response(PNG, "image/png"),
    )

    const cached = await ensureIconsCached([URL_A, URL_B])

    expect(cached).toEqual(new Set([URL_A, URL_B]))
  })

  it("ICN-12: keeps cache changes made during the downloads", async () => {
    mockStorage.get
      .mockResolvedValueOnce({ images: {} })
      .mockResolvedValueOnce({ images: { added: "data:added" }, other: 1 })

    await ensureIconsCached([URL_A])

    expect(mockStorage.set).toHaveBeenCalledWith("caches", {
      images: { added: "data:added", [URL_A]: dataUrl(PNG, "image/png") },
      other: 1,
    })
  })
})
