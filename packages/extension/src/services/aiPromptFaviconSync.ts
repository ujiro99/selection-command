import { getAiServices } from "@/services/aiPrompt"
import { calcContentHash } from "@/services/hub/commandContent"
import { Settings } from "@/services/settings/settings"
import { ensureIconsCached, ICON_FETCH_TIMEOUT_MS } from "@/services/iconCache"
import { Storage } from "@/services/storage"
import { isAiPromptCommand } from "@/lib/commandGuards"
import { isUrl } from "@/lib/url"
import { unique } from "@/lib/utils"
import type { Command } from "@/types"

/**
 * Statuses that mean the icon no longer exists. Other failures (offline, 5xx,
 * 403 from bot protection, ...) may be temporary, and must not cost the user
 * an icon of their own.
 */
const GONE_STATUSES = [404, 410]

const isGone = async (url: string): Promise<boolean> => {
  try {
    // Revalidate, so that the HTTP cache does not hide a removed icon.
    const res = await fetch(url, {
      cache: "no-cache",
      signal: AbortSignal.timeout(ICON_FETCH_TIMEOUT_MS),
    })
    if (GONE_STATUSES.includes(res.status)) return true
    // A site may answer a removed path with its HTML page. Other content types
    // are not judged: browsers can render icons served with an inaccurate one.
    const contentType = res.headers.get("content-type") ?? ""
    return res.ok && contentType.startsWith("text/html")
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
      command.iconUrl !== latest && isUrl(command.iconUrl),
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
  // Commands synced from another device arrive with a new URL and no cache on
  // this device, so the current favicons already in use are cached as well.
  const cached = await ensureIconsCached(
    unique([...inUse, ...replaced].map(({ latest }) => latest)),
  )

  // Replace only with an icon that is known to load.
  const replacements = new Map(
    replaced
      .filter(({ latest }) => cached.has(latest))
      .map(({ command, latest }) => [
        command.id,
        { from: command.iconUrl, to: latest },
      ]),
  )
  if (replacements.size === 0) return

  // Read again: the user may have edited a command during the requests.
  const current = await Storage.getCommands()
  const updated = current.flatMap((command) => {
    const replacement = replacements.get(command.id)
    return replacement && command.iconUrl === replacement.from
      ? [withIconUrl(command, replacement.to)]
      : []
  })
  if (updated.length > 0) {
    await Settings.updateCommands(updated)
  }
}
