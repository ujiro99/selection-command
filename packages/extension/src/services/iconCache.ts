import { bytesToDataUrl } from "@/lib/dataUrl"
import { Storage, LOCAL_STORAGE_KEY } from "@/services/storage"
import type { Caches } from "@/types"

/** A host that never answers must not hold back the other icons. */
export const ICON_FETCH_TIMEOUT_MS = 10_000

/** The cache shares the 10 MB quota of chrome.storage.local. */
const MAX_ICON_BYTES = 512 * 1024

const IMAGE_SIGNATURES: { mimeType: string; bytes: number[] }[] = [
  { mimeType: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mimeType: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mimeType: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38] },
  { mimeType: "image/x-icon", bytes: [0x00, 0x00, 0x01, 0x00] },
]

/** An SVG root, after anything allowed to come before it. */
const SVG_HEAD =
  /^(?:<\?xml[^>]*>|<!--[\s\S]*?-->|<!doctype svg[^>]*>|\s)*<svg[\s>]/i

const hasBytesAt = (data: Uint8Array, bytes: number[], offset = 0): boolean =>
  bytes.every((byte, i) => data[offset + i] === byte)

const sniffImageType = (data: Uint8Array): string | undefined => {
  const signature = IMAGE_SIGNATURES.find(({ bytes }) =>
    hasBytesAt(data, bytes),
  )
  if (signature) return signature.mimeType

  const isWebp =
    hasBytesAt(data, [0x52, 0x49, 0x46, 0x46]) &&
    hasBytesAt(data, [0x57, 0x45, 0x42, 0x50], 8)
  if (isWebp) return "image/webp"

  const head = new TextDecoder().decode(data.subarray(0, 1024))
  return SVG_HEAD.test(head) ? "image/svg+xml" : undefined
}

/**
 * Downloads an icon as a data URL, keeping its original bytes. Service workers
 * have no Image or canvas. Extension pages and service workers are not bound by
 * CORS on the hosts in host_permissions, unlike content scripts.
 *
 * Some servers send icons with an inaccurate type such as
 * application/octet-stream, so other types fall back to the file signature.
 */
export const fetchIconAsDataUrl = async (
  url: string,
  timeoutMs = ICON_FETCH_TIMEOUT_MS,
): Promise<string> => {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const bytes = new Uint8Array(await res.arrayBuffer())
  if (bytes.length === 0) throw new Error("Empty response")
  if (bytes.length > MAX_ICON_BYTES) {
    throw new Error(`Icon too large: ${bytes.length} bytes`)
  }

  const contentType = res.headers.get("content-type") ?? ""
  const declared = contentType.split(";")[0].trim().toLowerCase()
  const mimeType = declared.startsWith("image/")
    ? declared
    : sniffImageType(bytes)
  if (!mimeType) throw new Error(`Unexpected content type: ${contentType}`)

  return bytesToDataUrl(bytes, mimeType)
}

/**
 * Menus show icons from the image cache, because the CSP of a page may block
 * the original URL.
 *
 * @returns The URLs that are in the cache afterwards.
 */
export const ensureIconsCached = async (
  urls: string[],
): Promise<Set<string>> => {
  const caches = await Storage.get<Caches>(LOCAL_STORAGE_KEY.CACHES)
  const missing = urls.filter((url) => !caches.images?.[url])

  const results = await Promise.all(
    missing.map(async (url): Promise<[string, string] | null> => {
      try {
        return [url, await fetchIconAsDataUrl(url)]
      } catch (error) {
        console.warn("Failed to cache the icon", url, error)
        return null
      }
    }),
  )
  const images = Object.fromEntries(results.filter((r) => r != null))
  if (Object.keys(images).length > 0) {
    // Read again: the caches may have changed during the downloads.
    const latest = await Storage.get<Caches>(LOCAL_STORAGE_KEY.CACHES)
    await Storage.set<Caches>(LOCAL_STORAGE_KEY.CACHES, {
      ...latest,
      images: { ...latest.images, ...images },
    })
  }
  return new Set(urls.filter((url) => caches.images?.[url] || images[url]))
}
