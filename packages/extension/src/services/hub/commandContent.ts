import { OPEN_MODE } from "@/const"
import type { SelectionCommand } from "@/types"

/**
 * Helpers for the "content" of a command shared through the Hub.
 *
 * The content is the part of a command that the Hub distributes and that an
 * UpdateCommand replaces. Everything else (folder, popup size, window state,
 * icon color exclusion, shortcuts, source info) is a local setting and is kept.
 *
 * - `contentUpdatedAt`: when the content was last changed (ISO 8601). Compared
 *   by the Hub to tell whether a newer version is available.
 * - `contentHash`: fingerprint of the content as last received from / sent to
 *   the Hub. Used to tell whether the user edited the command locally.
 */

/** Fields replaced by an update from the Hub. */
export const HUB_CONTENT_FIELDS = [
  "title",
  "iconUrl",
  "openMode",
  "openModeSecondary",
  "spaceEncoding",
  "searchUrl",
  "aiPromptOption",
  "pageActionOption",
] as const

type HubContentField = (typeof HUB_CONTENT_FIELDS)[number]

export type HubContent = Partial<Record<HubContentField, unknown>>

export type HubContentStamp = {
  contentUpdatedAt: string
  contentHash: string
}

export function pickHubContent(cmd: object): HubContent {
  const src = cmd as Record<string, unknown>
  const content: HubContent = {}
  for (const key of HUB_CONTENT_FIELDS) {
    if (src[key] !== undefined) content[key] = src[key]
  }
  return content
}

/**
 * JSON serialization with sorted object keys, so that the same content always
 * produces the same string regardless of property order.
 */
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((v) => (v === undefined ? "null" : stableStringify(v))).join(",")}]`
  }
  if (value !== null && typeof value === "object") {
    const obj = value as Record<string, unknown>
    const entries = Object.keys(obj)
      .filter((k) => obj[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
    return `{${entries.join(",")}}`
  }
  return JSON.stringify(value) ?? "null"
}

/**
 * 53-bit string hash (cyrb53). Used only to detect local edits, so collision
 * resistance against crafted inputs is not required.
 */
function cyrb53(str: string, seed = 0): string {
  let h1 = 0xdeadbeef ^ seed
  let h2 = 0x41c6ce57 ^ seed
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507)
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507)
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  const hash = 4294967296 * (2097151 & h2) + (h1 >>> 0)
  return hash.toString(16)
}

export function calcContentHash(cmd: object): string {
  return cyrb53(stableStringify(pickHubContent(cmd)))
}

/**
 * Whether the command was edited locally after it was received from or sent
 * to the Hub. A command without a fingerprint counts as edited (safe side).
 */
export function isLocallyModified(cmd: SelectionCommand): boolean {
  if (!cmd.contentHash) return true
  return cmd.contentHash !== calcContentHash(cmd)
}

/** Returns the value as ISO 8601 if it is a valid date string. */
export function parseContentUpdatedAt(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const time = Date.parse(value)
  if (Number.isNaN(time)) return undefined
  return new Date(time).toISOString()
}

/**
 * Next `contentUpdatedAt` for content sent to the Hub: the later of now and
 * the previous value + 1ms, so the value never goes backwards even if the
 * device clock does.
 */
export function nextContentUpdatedAt(prev?: string, now = Date.now()): string {
  const prevTime = prev ? Date.parse(prev) : Number.NaN
  const time = Number.isNaN(prevTime) ? now : Math.max(now, prevTime + 1)
  return new Date(time).toISOString()
}

/**
 * Stamps a command that is about to be sent to the Hub (share / edit).
 * Returns the command to send (without the local-only fingerprint) and the
 * stamp to save locally.
 */
export function stampForHub<T extends SelectionCommand>(
  cmd: T,
  now = Date.now(),
): { command: Omit<T, "contentHash">; stamp: HubContentStamp } {
  const { contentHash: _contentHash, ...rest } = cmd
  const stamp = {
    contentUpdatedAt: nextContentUpdatedAt(cmd.contentUpdatedAt, now),
    contentHash: calcContentHash(cmd),
  }
  return {
    command: { ...rest, contentUpdatedAt: stamp.contentUpdatedAt },
    stamp,
  }
}

/** Fields that only make sense for some command types. */
const TYPE_SPECIFIC_FIELDS = [
  "openModeSecondary",
  "spaceEncoding",
  "searchUrl",
  "aiPromptOption",
  "pageActionOption",
] as const

/**
 * Replaces the content of an installed command with the content from the Hub
 * while keeping local settings.
 *
 * The source info is replaced too: after the overwrite the command is the
 * Hub's version again, not a local edit (e.g. selfUpdated -> hubCommunity).
 * It is kept only when the Hub did not send a valid one.
 */
export function applyHubContent(
  current: SelectionCommand,
  incoming: SelectionCommand,
): SelectionCommand {
  const next = { ...current } as Record<string, unknown>
  // Drop the old type-specific data so a type change does not leave stale fields.
  for (const key of TYPE_SPECIFIC_FIELDS) delete next[key]
  Object.assign(next, pickHubContent(incoming))
  if (next.openMode !== OPEN_MODE.WINDOW) delete next.windowState
  if (incoming.sourceType) {
    next.sourceType = incoming.sourceType
    next.sourceId = incoming.sourceId
  }
  const merged = next as SelectionCommand
  merged.contentUpdatedAt = incoming.contentUpdatedAt
  merged.contentHash = calcContentHash(merged)
  return merged
}
