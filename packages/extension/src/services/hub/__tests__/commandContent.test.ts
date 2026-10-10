import { describe, it, expect } from "vitest"
import {
  applyHubContent,
  calcContentHash,
  isLocallyModified,
  nextContentUpdatedAt,
  parseContentUpdatedAt,
  pickHubContent,
  stampForHub,
} from "../commandContent"
import type { SelectionCommand } from "@/types"

const base = {
  id: "cmd-1",
  title: "Search",
  iconUrl: "https://icon.png",
  openMode: "popup",
  openModeSecondary: "tab",
  spaceEncoding: "plus",
  searchUrl: "https://example.com?q=%s",
  parentFolderId: "folder-1",
  popupOption: { width: 300, height: 400 },
  windowState: "normal",
} as unknown as SelectionCommand

describe("pickHubContent", () => {
  it("CC-01: picks only content fields", () => {
    expect(pickHubContent(base)).toEqual({
      title: "Search",
      iconUrl: "https://icon.png",
      openMode: "popup",
      openModeSecondary: "tab",
      spaceEncoding: "plus",
      searchUrl: "https://example.com?q=%s",
    })
  })
})

describe("calcContentHash", () => {
  it("CC-02: ignores local settings", () => {
    const other = {
      ...base,
      parentFolderId: "folder-2",
      popupOption: { width: 1, height: 1 },
      contentUpdatedAt: "2026-01-01T00:00:00.000Z",
    }
    expect(calcContentHash(other)).toBe(calcContentHash(base))
  })

  it("CC-03: does not depend on key order", () => {
    const a = {
      ...base,
      openMode: "pageAction",
      pageActionOption: { startUrl: "https://a", steps: [{ id: "1" }] },
    }
    const b = {
      ...base,
      openMode: "pageAction",
      pageActionOption: { steps: [{ id: "1" }], startUrl: "https://a" },
    }
    expect(calcContentHash(a)).toBe(calcContentHash(b))
  })

  it("CC-04: changes when content changes", () => {
    expect(calcContentHash({ ...base, title: "Other" })).not.toBe(
      calcContentHash(base),
    )
    expect(
      calcContentHash({
        ...base,
        aiPromptOption: { serviceId: "x", prompt: "a", openMode: "tab" },
      }),
    ).not.toBe(calcContentHash(base))
  })
})

describe("isLocallyModified", () => {
  it("CC-05: false when the fingerprint matches", () => {
    const cmd = { ...base, contentHash: calcContentHash(base) }
    expect(isLocallyModified(cmd)).toBe(false)
  })

  it("CC-06: true when the content differs from the fingerprint", () => {
    const cmd = { ...base, contentHash: calcContentHash(base), title: "Edit" }
    expect(isLocallyModified(cmd)).toBe(true)
  })

  it("CC-07: true when there is no fingerprint", () => {
    expect(isLocallyModified(base)).toBe(true)
  })
})

describe("parseContentUpdatedAt", () => {
  it("CC-08: normalizes valid dates to ISO 8601", () => {
    expect(parseContentUpdatedAt("2026-01-02T03:04:05Z")).toBe(
      "2026-01-02T03:04:05.000Z",
    )
  })

  it("CC-09: returns undefined for invalid values", () => {
    expect(parseContentUpdatedAt("nope")).toBeUndefined()
    expect(parseContentUpdatedAt(123)).toBeUndefined()
    expect(parseContentUpdatedAt(undefined)).toBeUndefined()
  })
})

describe("nextContentUpdatedAt", () => {
  const now = Date.parse("2026-03-01T00:00:00.000Z")

  it("CC-10: uses now when there is no previous value", () => {
    expect(nextContentUpdatedAt(undefined, now)).toBe(
      "2026-03-01T00:00:00.000Z",
    )
  })

  it("CC-11: uses now when it is later than the previous value", () => {
    expect(nextContentUpdatedAt("2026-02-01T00:00:00.000Z", now)).toBe(
      "2026-03-01T00:00:00.000Z",
    )
  })

  it("CC-12: never goes backwards when the clock is behind", () => {
    expect(nextContentUpdatedAt("2026-04-01T00:00:00.000Z", now)).toBe(
      "2026-04-01T00:00:00.001Z",
    )
  })

  it("CC-13: ignores an unparsable previous value", () => {
    expect(nextContentUpdatedAt("nope", now)).toBe("2026-03-01T00:00:00.000Z")
  })
})

describe("stampForHub", () => {
  it("CC-14: sets contentUpdatedAt and strips the local fingerprint", () => {
    const now = Date.parse("2026-03-01T00:00:00.000Z")
    const cmd = { ...base, contentHash: "old" }
    const { command, stamp } = stampForHub(cmd, now)

    expect(command).not.toHaveProperty("contentHash")
    expect(command.contentUpdatedAt).toBe("2026-03-01T00:00:00.000Z")
    expect(stamp).toEqual({
      contentUpdatedAt: "2026-03-01T00:00:00.000Z",
      contentHash: calcContentHash(base),
    })
  })
})

describe("applyHubContent", () => {
  const local = {
    ...base,
    sourceType: "selfUpdated",
    sourceId: "self-updated-id",
  } as unknown as SelectionCommand

  it("CC-15: replaces content and keeps local settings", () => {
    const next = applyHubContent(local, {
      id: "cmd-1",
      title: "New",
      iconUrl: "https://new.png",
      openMode: "window",
      contentUpdatedAt: "2026-05-01T00:00:00.000Z",
    } as unknown as SelectionCommand)
    expect(next).toMatchObject({
      id: "cmd-1",
      title: "New",
      iconUrl: "https://new.png",
      openMode: "window",
      parentFolderId: "folder-1",
      popupOption: { width: 300, height: 400 },
      windowState: "normal",
      contentUpdatedAt: "2026-05-01T00:00:00.000Z",
    })
    expect(next).not.toHaveProperty("searchUrl")
    expect(next.contentHash).toBe(calcContentHash(next))
    expect(isLocallyModified(next)).toBe(false)
  })

  it("CC-16: drops windowState when the new open mode is not window", () => {
    const next = applyHubContent(local, {
      openMode: "tab",
    } as unknown as SelectionCommand)
    expect(next).not.toHaveProperty("windowState")
    expect(next.contentUpdatedAt).toBeUndefined()
  })

  it("CC-17: does not mutate the current command", () => {
    const current = { ...local }
    applyHubContent(current, { title: "New" } as unknown as SelectionCommand)
    expect(current).toEqual(local)
  })

  it("CC-18: resets the source info to the one sent by the Hub", () => {
    const next = applyHubContent(local, {
      title: "New",
      sourceType: "hubCommunity",
      sourceId: "hub-public-id",
    } as unknown as SelectionCommand)
    expect(next.sourceType).toBe("hubCommunity")
    expect(next.sourceId).toBe("hub-public-id")
  })

  it("CC-19: keeps the source info when the Hub sends none", () => {
    const next = applyHubContent(local, {
      title: "New",
    } as unknown as SelectionCommand)
    expect(next.sourceType).toBe("selfUpdated")
    expect(next.sourceId).toBe("self-updated-id")
  })
})
