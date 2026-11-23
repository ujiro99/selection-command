import { describe, it, expect, vi, beforeEach } from "vitest"
import type { HoverCardWindowState } from "../window"

let stored: HoverCardWindowState | null = null

vi.mock("../window", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../window")>()
  return {
    ...actual,
    HoverCardWindowStore: {
      get: vi.fn(async () => stored),
      set: vi.fn(async (s: HoverCardWindowState | null) => {
        stored = s
        return true
      }),
    },
  }
})

vi.mock("@/services/screen", () => ({
  getScreenSize: vi.fn(async () => ({
    width: 1920,
    height: 1080,
    left: 0,
    top: 0,
  })),
}))

import { openHoverCardWindow, onHoverCardWindowRemoved } from "../windowService"

const props = {
  providerId: "translate" as const,
  title: "Translate",
  text: "Bonjour",
  pageLang: "fr",
  top: 100,
  left: 200,
}

describe("openHoverCardWindow", () => {
  beforeEach(() => {
    stored = null
    chrome.windows.get = vi.fn() as unknown as typeof chrome.windows.get
    chrome.windows.create = vi.fn(async () => ({
      id: 42,
    })) as unknown as typeof chrome.windows.create
    chrome.windows.update = vi.fn(
      async () => ({}),
    ) as unknown as typeof chrome.windows.update
    chrome.runtime.getURL = vi.fn((p: string) => `chrome-extension://id/${p}`)
  })

  it("HC-W-01: creates a popup window and stores its input and id", async () => {
    await openHoverCardWindow(props)

    expect(chrome.windows.create).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "chrome-extension://id/src/hover_card_window.html",
        type: "popup",
        top: 100,
        left: 200,
      }),
    )
    expect(stored).toEqual({
      providerId: "translate",
      title: "Translate",
      text: "Bonjour",
      pageLang: "fr",
      windowId: 42,
    })
  })

  it("HC-W-02: reuses the open window and replaces its input", async () => {
    stored = { ...props, windowId: 7, text: "old" }
    chrome.windows.get = vi.fn(async () => ({
      id: 7,
    })) as unknown as typeof chrome.windows.get

    await openHoverCardWindow(props)

    expect(chrome.windows.create).not.toHaveBeenCalled()
    expect(chrome.windows.update).toHaveBeenCalledWith(7, { focused: true })
    expect(stored).toMatchObject({ windowId: 7, text: "Bonjour" })
  })

  it("HC-W-03: creates a new window when the stored one is gone", async () => {
    stored = { ...props, windowId: 7, text: "old" }
    chrome.windows.get = vi.fn(async () => {
      throw new Error("No window with id: 7")
    }) as unknown as typeof chrome.windows.get

    await openHoverCardWindow(props)

    expect(chrome.windows.create).toHaveBeenCalled()
    expect(stored).toMatchObject({ windowId: 42, text: "Bonjour" })
  })

  it("HC-W-04: clears the state when window creation fails", async () => {
    chrome.windows.create = vi.fn(async () => {
      throw new Error("failed")
    }) as unknown as typeof chrome.windows.create

    await expect(openHoverCardWindow(props)).rejects.toThrow("failed")
    expect(stored).toBeNull()
  })
})

describe("onHoverCardWindowRemoved", () => {
  it("HC-W-05: clears the state only for the hover card window", async () => {
    stored = { ...props, windowId: 7 }

    await onHoverCardWindowRemoved(8)
    expect(stored).not.toBeNull()

    await onHoverCardWindowRemoved(7)
    expect(stored).toBeNull()
  })
})
