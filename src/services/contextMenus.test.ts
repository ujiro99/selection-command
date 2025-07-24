import { describe, it, expect, vi, beforeEach } from "vitest"
import { enhancedSettings } from "@/services/settings/enhancedSettings"
import { ContextMenu } from "./contextMenus"

// Mock dependencies
vi.mock("@/services/settings/enhancedSettings")
vi.mock("@/services/settings/settings")

const mockEnhancedSettings = vi.mocked(enhancedSettings)

// Mock Chrome APIs
global.chrome = {
  contextMenus: {
    removeAll: vi.fn(),
    create: vi.fn(),
    onClicked: {
      removeListener: vi.fn(),
      addListener: vi.fn(),
    },
  },
} as any

describe("Service Layer Migration", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mock
    mockEnhancedSettings.get.mockResolvedValue({
      commands: [],
      folders: [],
      pageRules: [],
      stars: [],
      shortcuts: { shortcuts: [] },
      commandExecutionCount: 0,
      hasShownReviewRequest: false,
      startupMethod: { method: "contextMenu", threshold: 1 },
    } as any)
  })

  it("MG-02-b: should use enhancedSettings.get() in contextMenus", async () => {
    // Mock chrome.contextMenus.removeAll to call the callback
    ;(chrome.contextMenus.removeAll as any).mockImplementation(
      (callback: () => void) => {
        callback()
      },
    )

    // This test will fail initially because ContextMenu.init still uses Settings.get()
    ContextMenu.init()

    // Give some time for async operations (setTimeout is 200ms in contextMenus.ts)
    await new Promise((resolve) => setTimeout(resolve, 250))

    expect(mockEnhancedSettings.get).toHaveBeenCalledTimes(1)
  })
})
