import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { useSettingsWithImageCache } from "./useSettingsWithImageCache"
import { enhancedSettings } from "../services/settings/enhancedSettings"
import { settingsCache } from "../services/settings/settingsCache"
import { getAiServicesFallback } from "@/services/aiPromptFallback"
import { Ipc } from "@/services/ipc"
import { OPEN_MODE } from "@/const"
import type { SettingsType, Command, Caches } from "@/types"

// Mock dependencies
vi.mock("../services/settings/enhancedSettings")
vi.mock("../services/settings/settingsCache")

// The recoloring decision is answered by the service worker; stand in for it
// with the real check so the hook is exercised end to end.
vi.mock("@/services/ipc", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/services/ipc")>()
  const { shouldPreserveIconColor } = await import("@/lib/favicon")
  return {
    ...original,
    Ipc: {
      ...original.Ipc,
      send: vi.fn(async (_command: unknown, queries: unknown) =>
        (queries as Array<{ url?: string; targetUrl?: string }>).map((query) =>
          shouldPreserveIconColor(query),
        ),
      ),
    },
  }
})

const mockEnhancedSettings = vi.mocked(enhancedSettings)
const mockSettingsCache = vi.mocked(settingsCache)
const mockIpcSend = vi.mocked(Ipc.send)

// Mock window.location, which useUserSettings reads to match page rules
Object.defineProperty(window, "location", {
  value: {
    href: "https://example.com/test",
  },
  writable: true,
})

// Sections are requested in this order: user settings, commands, caches.
const mockSections = (
  settings: Partial<SettingsType>,
  commands: Command[],
  caches?: Caches,
) => {
  mockEnhancedSettings.getSection
    .mockResolvedValueOnce(settings as any)
    .mockResolvedValueOnce(commands as any)
    .mockResolvedValueOnce((caches ?? { images: {} }) as any)
}

const renderSettings = async () => {
  const rendered = renderHook(() => useSettingsWithImageCache())

  await waitFor(() => expect(rendered.result.current.loading).toBe(false))

  return rendered
}

describe("useSettingsWithImageCache", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mocks
    mockEnhancedSettings.get.mockResolvedValue({} as SettingsType)
    mockEnhancedSettings.getSection.mockResolvedValue({})
    mockSettingsCache.subscribe.mockImplementation(() => {})
    mockSettingsCache.unsubscribe.mockImplementation(() => {})
    mockIpcSend.mockImplementation(
      async (_command: unknown, queries: unknown) =>
        (queries as Array<{ url?: string; targetUrl?: string }>).map((query) =>
          query.url?.includes("favicon.ico") ||
          query.url?.includes("gstatic.com")
            ? true
            : query.targetUrl?.includes("https://example.com/") &&
                query.url?.includes("cdn.example.com")
              ? true
              : false,
        ),
    )
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it("US-25: should return settings with image cache applied", async () => {
    const command = {
      id: "1",
      title: "Test",
      openMode: OPEN_MODE.POPUP,
      iconUrl: "http://example.com/icon.png",
    }
    const folder = {
      id: "1",
      title: "Folder",
      iconUrl: "http://example.com/folder.png",
    }

    mockSections({ folders: [folder] }, [command as Command], {
      images: {
        "http://example.com/icon.png": "data:image/png;base64,cached",
        "http://example.com/folder.png": "data:image/png;base64,cached2",
      },
    })

    const { result } = await renderSettings()

    expect(result.current.commands).toEqual([
      {
        ...command,
        iconUrl: "data:image/png;base64,cached",
        preserveOriginalColor: false,
      },
    ])
    expect(result.current.folders).toEqual([
      {
        ...folder,
        iconUrl: "data:image/png;base64,cached2",
        preserveOriginalColor: false,
      },
    ])
  })

  it("US-26: should handle folders without iconUrl", async () => {
    const folders = [
      { id: "1", title: "Folder", iconUrl: "" },
      { id: "2", title: "Folder2" }, // No iconUrl
    ]

    mockSections({ folders }, [])

    const { result } = await renderSettings()

    expect(result.current.folders).toEqual([
      { id: "1", title: "Folder", iconUrl: "", preserveOriginalColor: false },
      { id: "2", title: "Folder2", preserveOriginalColor: false },
    ])
  })

  it("US-27: should decide icon recoloring from the configured URL, not the cached one", async () => {
    const favicon = "https://chatgpt.com/favicon.ico"
    const genericIcon = "https://cdn-icons-png.flaticon.com/512/11865/1.png"
    const cachedFavicon = "data:image/png;base64,cached-favicon"
    const cachedGenericIcon = "data:image/png;base64,cached-generic"

    const brandCommand = {
      id: "cmd1",
      title: "Command 1",
      openMode: OPEN_MODE.POPUP,
      iconUrl: favicon,
    }
    const genericCommand = {
      id: "cmd2",
      title: "Command 2",
      openMode: OPEN_MODE.POPUP,
      iconUrl: genericIcon,
    }
    const brandFolder = { id: "folder1", title: "Folder 1", iconUrl: favicon }
    const genericFolder = {
      id: "folder2",
      title: "Folder 2",
      iconUrl: genericIcon,
    }

    mockSections(
      { folders: [brandFolder, genericFolder] },
      [brandCommand, genericCommand] as Command[],
      {
        images: {
          [favicon]: cachedFavicon,
          [genericIcon]: cachedGenericIcon,
        },
      },
    )

    const { result } = await renderSettings()

    // Icons known to carry their own colors keep them, the generic ones don't.
    expect(result.current.commands).toEqual([
      { ...brandCommand, iconUrl: cachedFavicon, preserveOriginalColor: true },
      {
        ...genericCommand,
        iconUrl: cachedGenericIcon,
        preserveOriginalColor: false,
      },
    ])
    expect(result.current.folders).toEqual([
      { ...brandFolder, iconUrl: cachedFavicon, preserveOriginalColor: true },
      {
        ...genericFolder,
        iconUrl: cachedGenericIcon,
        preserveOriginalColor: false,
      },
    ])
  })

  it("US-27-a: should preserve the colors of an icon served by the command's own site", async () => {
    const siteCommand = {
      id: "cmd1",
      title: "Example",
      openMode: OPEN_MODE.POPUP,
      searchUrl: "https://example.com/search?q=%s",
      iconUrl: "https://cdn.example.com/images/logo.png",
    }
    const otherCommand = {
      id: "cmd2",
      title: "Example",
      openMode: OPEN_MODE.POPUP,
      searchUrl: "https://example.com/search?q=%s",
      iconUrl: "https://cdn.other.com/images/logo.png",
    }

    mockSections({ folders: [] }, [siteCommand, otherCommand] as Command[])

    const { result } = await renderSettings()

    expect(result.current.commands.map((c) => c.preserveOriginalColor)).toEqual(
      [true, false],
    )
  })

  it("US-28: should use original URLs when cache is not available", async () => {
    const command = {
      id: "1",
      openMode: OPEN_MODE.POPUP,
      title: "Test",
      iconUrl: "http://example.com/icon.png",
    }
    const folder = {
      id: "1",
      title: "Folder",
      iconUrl: "http://example.com/folder.png",
    }

    mockSections({ folders: [folder] }, [command as Command])

    const { result } = await renderSettings()

    expect(result.current.commands).toEqual([
      { ...command, preserveOriginalColor: false },
    ])
    expect(result.current.folders).toEqual([
      { ...folder, preserveOriginalColor: false },
    ])
  })

  it("US-28-a: should handle empty cache strings", async () => {
    const command = {
      id: "1",
      openMode: OPEN_MODE.POPUP,
      title: "Test",
      iconUrl: "http://example.com/icon.png",
    }

    mockSections({ folders: [] }, [command as Command], {
      images: {
        "http://example.com/icon.png": "", // Empty cache
      },
    })

    const { result } = await renderSettings()

    expect(result.current.commands).toEqual([
      { ...command, preserveOriginalColor: false },
    ])
  })

  it("US-29: should handle loading state", async () => {
    // Mock a delayed response
    mockEnhancedSettings.get.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({} as any), 100)),
    )

    const { result } = renderHook(() => useSettingsWithImageCache())

    // Should return empty arrays during loading
    expect(result.current.commands).toEqual([])
    expect(result.current.folders).toEqual([])
    expect(result.current.loading).toBe(true)
  })

  it("US-30: should retry icon color resolution after an IPC length mismatch", async () => {
    const command = {
      id: "retry",
      openMode: OPEN_MODE.POPUP,
      title: "Retry",
      iconUrl: "http://mismatch.example.com/icon.png",
    }

    mockSections({ folders: [] }, [command as Command])
    mockSections({ folders: [] }, [command as Command])
    mockIpcSend.mockResolvedValueOnce([]).mockResolvedValueOnce([false])

    const firstRender = renderHook(() => useSettingsWithImageCache())
    await waitFor(() => expect(firstRender.result.current.loading).toBe(false))
    expect(mockIpcSend).toHaveBeenCalledTimes(1)
    // Falls back to the default colors instead of blocking the menu.
    expect(firstRender.result.current.commands).toEqual([
      { ...command, preserveOriginalColor: false },
    ])
    firstRender.unmount()

    const secondRender = renderHook(() => useSettingsWithImageCache())
    await waitFor(() => expect(secondRender.result.current.loading).toBe(false))

    expect(mockIpcSend).toHaveBeenCalledTimes(2)
    expect(secondRender.result.current.commands).toEqual([
      { ...command, preserveOriginalColor: false },
    ])
  })

  it("US-30-a: should fall back to the default colors when IPC returns null", async () => {
    const command = {
      id: "null-response",
      openMode: OPEN_MODE.POPUP,
      title: "Null response",
      iconUrl: "http://null.example.com/icon.png",
    }
    const folder = {
      id: "null-folder",
      title: "Null folder",
      iconUrl: "http://null.example.com/folder.png",
    }

    mockSections({ folders: [folder] }, [command as Command])
    mockIpcSend.mockResolvedValueOnce(null as any)

    const { result } = renderHook(() => useSettingsWithImageCache())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.commands).toEqual([
      { ...command, preserveOriginalColor: false },
    ])
    expect(result.current.folders).toEqual([
      { ...folder, preserveOriginalColor: false },
    ])
  })

  it("US-31: should use the AI service URL for AI Prompt icon preservation", async () => {
    const chatgptUrl = getAiServicesFallback().find(
      (s) => s.id === "chatgpt",
    )?.url
    expect(chatgptUrl).toBeDefined()

    const command = {
      id: "ai-prompt",
      openMode: OPEN_MODE.AI_PROMPT,
      title: "AI Prompt",
      searchUrl: "https://example.com/search?q=%s",
      iconUrl: "https://chatgpt.com/favicon.ico",
      aiPromptOption: {
        serviceId: "chatgpt",
        prompt: "hello",
        openMode: OPEN_MODE.POPUP,
      },
    }

    mockSections({ folders: [] }, [command as Command])

    const { result } = await renderSettings()

    expect(chatgptUrl).toContain("chatgpt.com")
    expect(result.current.commands).toEqual([
      { ...command, preserveOriginalColor: true },
    ])
  })
})
