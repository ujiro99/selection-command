import { getAiServices } from "@/services/aiPrompt"
import { calcContentHash } from "@/services/hub/commandContent"
import { Settings } from "@/services/settings/settings"
import { Storage, LOCAL_STORAGE_KEY } from "@/services/storage"
import { isAiPromptCommand } from "@/lib/commandGuards"
import { unique } from "@/lib/utils"
import type { Caches, Command } from "@/types"

/**
 * Statuses that mean the icon no longer exists. Other failures (offline, 5xx,
 * 403 from bot protection, ...) may be temporary, and must not cost the user
 * an icon of their own.
 */
const GONE_STATUSES = [404, 410]

const isHttpUrl = (url: string): boolean => /^https?:\/\//.test(url)

const isGone = async (url: string): Promise<boolean> => {
  try {
    // Revalidate, so that the HTTP cache does not hide a removed icon.
    const res = await fetch(url, { cache: "no-cache" })
    return GONE_STATUSES.includes(res.status)
  } catch {
    return false
  }
}

/**
 * iconUrl is part of the Hub content, so changing it would look like a local
 * edit. Move the fingerprint along, unless the command already has local edits.
 */
const withIconUrl = (command: Command, iconUrl: string): Command => {
  const updated = { ...command, iconUrl }
  if (
    "contentHash" in command &&
    command.contentHash === calcContentHash(command)
  ) {
    return { ...updated, contentHash: calcContentHash(updated) } as Command
  }
  return updated
}

/** Converts an icon to a data URL. Service workers have no Image or canvas. */
const fetchAsDataUrl = async (url: string): Promise<string> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const contentType = res.headers.get("content-type") ?? ""
  if (!contentType.startsWith("image/")) {
    throw new Error(`Unexpected content type: ${contentType}`)
  }
  const bytes = new Uint8Array(await res.arrayBuffer())
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join("")
  return `data:${contentType};base64,${btoa(binary)}`
}

/**
 * Menus show icons from the image cache, because the CSP of a page may block
 * the original URL. Commands synced from another device arrive with a new URL
 * and no cache on this device, so every URL in use is checked, not only the
 * ones changed by this run.
 *
 * @returns The URLs that are in the cache afterwards.
 */
const ensureCached = async (urls: string[]): Promise<Set<string>> => {
  const caches = await Storage.get<Caches>(LOCAL_STORAGE_KEY.CACHES)
  const missing = urls.filter((url) => !caches.images?.[url])

  const results = await Promise.all(
    missing.map(async (url): Promise<[string, string] | null> => {
      try {
        return [url, await fetchAsDataUrl(url)]
      } catch (error) {
        console.warn("Failed to cache the favicon", url, error)
        return null
      }
    }),
  )
  const images = Object.fromEntries(results.filter((r) => r != null))
  if (Object.keys(images).length > 0) {
    await Storage.set<Caches>(LOCAL_STORAGE_KEY.CACHES, {
      ...caches,
      images: { ...caches.images, ...images },
    })
  }
  return new Set(urls.filter((url) => caches.images?.[url] || images[url]))
}

/**
 * Replaces the icon of AiPrompt commands with the current favicon of their
 * service when the icon no longer exists. An icon that can still be loaded is
 * kept, whether it is a former favicon of the service or the user's own choice.
 */
export const syncAiPromptFavicons = async (): Promise<void> => {
  const services = await getAiServices()
  const commands = await Storage.getCommands()

  const targets = commands.flatMap((command) => {
    if (!isAiPromptCommand(command)) return []
    const { serviceId } = command.aiPromptOption
    const latest = services.find((s) => s.id === serviceId)?.faviconUrl
    return latest ? [{ command, latest }] : []
  })

  const outdated = targets.filter(
    ({ command, latest }) =>
      command.iconUrl !== latest && isHttpUrl(command.iconUrl),
  )
  const outdatedUrls = unique(outdated.map(({ command }) => command.iconUrl))
  const goneFlags = await Promise.all(outdatedUrls.map(isGone))
  const goneUrls = new Set(outdatedUrls.filter((_, i) => goneFlags[i]))
  const replaced = outdated.filter(({ command }) =>
    goneUrls.has(command.iconUrl),
  )

  const inUse = targets.filter(({ command, latest }) => {
    return command.iconUrl === latest
  })
  const cached = await ensureCached(
    unique([...inUse, ...replaced].map(({ latest }) => latest)),
  )

  // Replace only with an icon that is known to load.
  const updated = replaced
    .filter(({ latest }) => cached.has(latest))
    .map(({ command, latest }) => withIconUrl(command, latest))
  if (updated.length > 0) {
    await Settings.updateCommands(updated)
  }
}
