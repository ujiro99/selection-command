import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  navigateSidePanel,
  openSidePanel,
  closeSidePanel,
  sidePanelClosed,
} from "./helper"
import { BgData } from "@/services/backgroundData"
import {
  openSidePanel as _openSidePanel,
  closeSidePanel as _closeSidePanel,
  updateSidePanelUrl,
} from "@/services/chrome"
import { enhancedSettings } from "@/services/settings/enhancedSettings"
import { incrementCommandExecutionCount } from "@/services/commandMetrics"

// Mock dependencies
vi.mock("@/services/backgroundData", () => ({
  BgData: {
    get: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock("@/services/chrome", () => ({
  openSidePanel: vi.fn(),
  closeSidePanel: vi.fn(),
  updateSidePanelUrl: vi.fn(),
}))

vi.mock("@/services/settings/enhancedSettings", () => ({
  enhancedSettings: {
    get: vi.fn(),
  },
}))

vi.mock("@/services/commandMetrics", () => ({
  incrementCommandExecutionCount: vi.fn().mockResolvedValue(undefined),
}))

describe("helper", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("navigateSidePanel", () => {
    it("NSP-01: Should return false when tabId is null", () => {
      const param = { url: "https://example.com", tabId: null }
      const sender = {} as any

      const result = navigateSidePanel(param, sender)

      expect(result).toBe(false)
    })

    it("NSP-02: Should return false for invalid URL", () => {
      const param = { url: "not-a-valid-url", tabId: 123 }
      const sender = {} as any

      vi.mocked(BgData.get).mockReturnValue({
        sidePanelTabs: [{ tabId: 123, isLinkCommand: false }],
      } as any)

      const result = navigateSidePanel(param, sender)

      expect(result).toBe(false)
    })

    it("NSP-03: Should return false for javascript: protocol", () => {
      const param = { url: "javascript:alert('test')", tabId: 123 }
      const sender = {} as any

      vi.mocked(BgData.get).mockReturnValue({
        sidePanelTabs: [{ tabId: 123, isLinkCommand: false }],
      } as any)

      const result = navigateSidePanel(param, sender)

      expect(result).toBe(false)
    })

    it("NSP-04: Should return false for data: protocol", () => {
      const param = { url: "data:text/html,<h1>Test</h1>", tabId: 123 }
      const sender = {} as any

      vi.mocked(BgData.get).mockReturnValue({
        sidePanelTabs: [{ tabId: 123, isLinkCommand: false }],
      } as any)

      const result = navigateSidePanel(param, sender)

      expect(result).toBe(false)
    })

    it("NSP-05: Should return false when tab is not in sidePanelTabs", () => {
      const param = { url: "https://example.com", tabId: 123 }
      const sender = {} as any

      vi.mocked(BgData.get).mockReturnValue({
        sidePanelTabs: [
          { tabId: 456, isLinkCommand: false },
          { tabId: 789, isLinkCommand: false },
        ], // Different tab IDs
      } as any)

      const result = navigateSidePanel(param, sender)

      expect(result).toBe(false)
    })

    it("NSP-06: Should update URL when all conditions are met", async () => {
      const tabId = 123
      const url = "https://example.com"
      const param = { url, tabId }
      const sender = {} as any

      vi.mocked(BgData.get).mockReturnValue({
        sidePanelTabs: [{ tabId, isLinkCommand: false }],
        sidePanelUrls: {},
      } as any)

      vi.mocked(updateSidePanelUrl).mockResolvedValue(undefined)
      vi.mocked(BgData.update).mockResolvedValue(true)

      const result = navigateSidePanel(param, sender)

      expect(result).toBe(false)

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(updateSidePanelUrl).toHaveBeenCalledWith({ url, tabId })
    })

    it("NSP-07: Should handle updateSidePanelUrl errors gracefully", async () => {
      const tabId = 123
      const url = "https://example.com"
      const param = { url, tabId }
      const sender = {} as any

      vi.mocked(BgData.get).mockReturnValue({
        sidePanelTabs: [{ tabId, isLinkCommand: false }],
        sidePanelUrls: {},
      } as any)

      vi.mocked(updateSidePanelUrl).mockRejectedValue(
        new Error("Update failed"),
      )

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {})

      const result = navigateSidePanel(param, sender)

      expect(result).toBe(false)

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[navigateSidePanel] Error:",
        expect.any(Error),
      )

      consoleErrorSpy.mockRestore()
    })

    it("NSP-08: Should update BgData.sidePanelUrls after successful URL update", async () => {
      const tabId = 123
      const url = "https://example.com"
      const param = { url, tabId }
      const sender = {} as any

      const mockData = {
        sidePanelTabs: [{ tabId, isLinkCommand: false }],
        sidePanelUrls: {},
      } as any

      vi.mocked(BgData.get).mockReturnValue(mockData)

      vi.mocked(updateSidePanelUrl).mockResolvedValue(undefined)
      vi.mocked(BgData.update).mockImplementation((updater) => {
        if (typeof updater === "function") {
          const result = updater(mockData)
          expect(result.sidePanelUrls?.[tabId]).toBe(url)
        }
        return Promise.resolve(true)
      })

      navigateSidePanel(param, sender)

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(BgData.update).toHaveBeenCalledWith(expect.any(Function))
    })
  })

  describe("openSidePanel", () => {
    it("OSP-01: Should use sender.tab.id when available", async () => {
      const tabId = 123
      const param = { url: "https://example.com", isLinkCommand: false }
      const sender = { tab: { id: tabId } } as any
      const response = vi.fn()
      const mockBgData = { sidePanelTabs: [] } as any

      vi.mocked(_openSidePanel).mockResolvedValue({ tabId } as any)
      vi.mocked(incrementCommandExecutionCount).mockResolvedValue(undefined)
      vi.mocked(BgData.update).mockImplementation((updater) => {
        if (typeof updater === "function") {
          updater(mockBgData)
        }
        return Promise.resolve(true)
      })

      const result = openSidePanel(param, sender, response)

      expect(result).toBe(true)

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(_openSidePanel).toHaveBeenCalledWith({ ...param, tabId })
    })

    it("OSP-02: Should fall back to bgData.activeTabId when sender.tab.id is null", async () => {
      const activeTabId = 456
      const param = { url: "https://example.com", isLinkCommand: false }
      const sender = {} as any // No tab.id
      const response = vi.fn()
      const mockBgData = { activeTabId, sidePanelTabs: [] } as any

      vi.mocked(BgData.get).mockReturnValue(mockBgData)
      vi.mocked(_openSidePanel).mockResolvedValue({ tabId: activeTabId } as any)
      vi.mocked(incrementCommandExecutionCount).mockResolvedValue(undefined)
      vi.mocked(BgData.update).mockImplementation((updater) => {
        if (typeof updater === "function") {
          updater(mockBgData)
        }
        return Promise.resolve(true)
      })

      const result = openSidePanel(param, sender, response)

      expect(result).toBe(true)

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(_openSidePanel).toHaveBeenCalledWith({
        ...param,
        tabId: activeTabId,
      })
      expect(response).toHaveBeenCalledWith(true)
    })

    it("OSP-03: Should return false when both sender.tab.id and bgData.activeTabId are null", () => {
      const param = { url: "https://example.com", isLinkCommand: false }
      const sender = {} as any
      const response = vi.fn()

      vi.mocked(BgData.get).mockReturnValue({
        activeTabId: null,
        sidePanelTabs: [],
      } as any)

      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {})

      const result = openSidePanel(param, sender, response)

      expect(result).toBe(false)
      expect(response).toHaveBeenCalledWith(false)
      expect(_openSidePanel).not.toHaveBeenCalled()

      consoleWarnSpy.mockRestore()
    })

    it("OSP-04: Should register tab in BgData.sidePanelTabs with correct isLinkCommand after openSidePanel succeeds", async () => {
      const tabId = 123
      const param = { url: "https://example.com", isLinkCommand: true }
      const sender = { tab: { id: tabId } } as any
      const response = vi.fn()
      const mockBgData = { sidePanelTabs: [] } as any

      vi.mocked(_openSidePanel).mockResolvedValue({ tabId } as any)
      vi.mocked(incrementCommandExecutionCount).mockResolvedValue(undefined)
      vi.mocked(BgData.update).mockImplementation((updater) => {
        if (typeof updater === "function") {
          const result = updater(mockBgData)
          expect(result.sidePanelTabs).toContainEqual({
            tabId,
            isLinkCommand: true,
          })
        }
        return Promise.resolve(true)
      })

      openSidePanel(param, sender, response)

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(response).toHaveBeenCalledWith(true)
      expect(BgData.update).toHaveBeenCalledWith(expect.any(Function))
    })

    it("OSP-05: Should call response(false) when _openSidePanel rejects", async () => {
      const tabId = 123
      const param = { url: "https://example.com", isLinkCommand: false }
      const sender = { tab: { id: tabId } } as any
      const response = vi.fn()

      vi.mocked(_openSidePanel).mockRejectedValue(new Error("Panel error"))

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {})

      openSidePanel(param, sender, response)

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(response).toHaveBeenCalledWith(false)

      consoleErrorSpy.mockRestore()
    })
  })

  describe("closeSidePanel", () => {
    it("CSP-01: Should return false when sender.tab.id is null", () => {
      const sender = {} as any
      const response = vi.fn()

      const result = closeSidePanel(undefined, sender, response)

      expect(result).toBe(false)
      expect(response).not.toHaveBeenCalled()
    })

    it("CSP-02: Should close panel when isLinkCommand=true and linkCommand.sidePanelAutoHide=true", async () => {
      const tabId = 123
      const sender = { tab: { id: tabId } } as any
      const response = vi.fn()

      vi.mocked(enhancedSettings.get).mockResolvedValue({
        linkCommand: { sidePanelAutoHide: true },
        windowOption: { sidePanelAutoHide: false },
      } as any)

      vi.mocked(BgData.get).mockReturnValue({
        sidePanelTabs: [{ tabId, isLinkCommand: true }],
      } as any)

      vi.mocked(_closeSidePanel).mockResolvedValue(undefined)

      const result = closeSidePanel(undefined, sender, response)

      expect(result).toBe(true)

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(_closeSidePanel).toHaveBeenCalledWith(tabId)
      expect(response).toHaveBeenCalledWith(true)
    })

    it("CSP-03: Should NOT close panel when isLinkCommand=true and linkCommand.sidePanelAutoHide=false", async () => {
      const tabId = 123
      const sender = { tab: { id: tabId } } as any
      const response = vi.fn()

      vi.mocked(enhancedSettings.get).mockResolvedValue({
        linkCommand: { sidePanelAutoHide: false },
        windowOption: { sidePanelAutoHide: true },
      } as any)

      vi.mocked(BgData.get).mockReturnValue({
        sidePanelTabs: [{ tabId, isLinkCommand: true }],
      } as any)

      const result = closeSidePanel(undefined, sender, response)

      expect(result).toBe(true)

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(_closeSidePanel).not.toHaveBeenCalled()
      expect(response).toHaveBeenCalledWith(true)
    })

    it("CSP-04: Should close panel when isLinkCommand=false and windowOption.sidePanelAutoHide=true", async () => {
      const tabId = 123
      const sender = { tab: { id: tabId } } as any
      const response = vi.fn()

      vi.mocked(enhancedSettings.get).mockResolvedValue({
        linkCommand: { sidePanelAutoHide: false },
        windowOption: { sidePanelAutoHide: true },
      } as any)

      vi.mocked(BgData.get).mockReturnValue({
        sidePanelTabs: [{ tabId, isLinkCommand: false }],
      } as any)

      vi.mocked(_closeSidePanel).mockResolvedValue(undefined)

      const result = closeSidePanel(undefined, sender, response)

      expect(result).toBe(true)

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(_closeSidePanel).toHaveBeenCalledWith(tabId)
      expect(response).toHaveBeenCalledWith(true)
    })

    it("CSP-05: Should NOT close panel when isLinkCommand=false and windowOption.sidePanelAutoHide=false", async () => {
      const tabId = 123
      const sender = { tab: { id: tabId } } as any
      const response = vi.fn()

      vi.mocked(enhancedSettings.get).mockResolvedValue({
        linkCommand: { sidePanelAutoHide: true },
        windowOption: { sidePanelAutoHide: false },
      } as any)

      vi.mocked(BgData.get).mockReturnValue({
        sidePanelTabs: [{ tabId, isLinkCommand: false }],
      } as any)

      const result = closeSidePanel(undefined, sender, response)

      expect(result).toBe(true)

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(_closeSidePanel).not.toHaveBeenCalled()
      expect(response).toHaveBeenCalledWith(true)
    })

    it("CSP-06: Should call response(true) without closing panel when tab is not in sidePanelTabs", async () => {
      const tabId = 123
      const sender = { tab: { id: tabId } } as any
      const response = vi.fn()

      vi.mocked(enhancedSettings.get).mockResolvedValue({
        linkCommand: { sidePanelAutoHide: true },
        windowOption: { sidePanelAutoHide: true },
      } as any)

      vi.mocked(BgData.get).mockReturnValue({
        sidePanelTabs: [], // Tab not found
      } as any)

      const result = closeSidePanel(undefined, sender, response)

      expect(result).toBe(true)

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(_closeSidePanel).not.toHaveBeenCalled()
      expect(response).toHaveBeenCalledWith(true)
    })

    it("CSP-07: Should call response(false) when enhancedSettings.get() rejects", async () => {
      const tabId = 123
      const sender = { tab: { id: tabId } } as any
      const response = vi.fn()

      vi.mocked(enhancedSettings.get).mockRejectedValue(
        new Error("Settings error"),
      )

      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {})

      const result = closeSidePanel(undefined, sender, response)

      expect(result).toBe(true)

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(response).toHaveBeenCalledWith(false)

      consoleWarnSpy.mockRestore()
    })
  })

  describe("sidePanelClosed", () => {
    it("SPC-01: Should return early without calling BgData.update when tabId is undefined", async () => {
      await sidePanelClosed(undefined)

      expect(BgData.update).not.toHaveBeenCalled()
    })

    it("SPC-02: Should remove tab from sidePanelTabs and sidePanelUrls when tabId is provided", async () => {
      const tabId = 123
      const mockData = {
        sidePanelTabs: [
          { tabId, isLinkCommand: false },
          { tabId: 456, isLinkCommand: false },
        ],
        sidePanelUrls: {
          [tabId]: "https://example.com",
          456: "https://other.com",
        },
      } as any

      vi.mocked(BgData.update).mockImplementation((updater) => {
        if (typeof updater === "function") {
          const result = updater(mockData)
          expect(result.sidePanelTabs).not.toContainEqual({
            tabId,
            isLinkCommand: false,
          })
          expect(result.sidePanelTabs).toContainEqual({
            tabId: 456,
            isLinkCommand: false,
          })
          expect(result.sidePanelUrls![tabId]).toBeUndefined()
          expect(result.sidePanelUrls![456]).toBe("https://other.com")
        }
        return Promise.resolve(true)
      })

      await sidePanelClosed(tabId)

      expect(BgData.update).toHaveBeenCalledWith(expect.any(Function))
    })

    it("SPC-03: Should catch and log warning when BgData.update throws", async () => {
      const tabId = 123

      vi.mocked(BgData.update).mockRejectedValue(new Error("Update failed"))

      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {})

      await sidePanelClosed(tabId)

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Failed to cleanup side panel:",
        expect.any(Error),
      )

      consoleWarnSpy.mockRestore()
    })
  })
})
