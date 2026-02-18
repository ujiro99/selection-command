import { describe, it, expect, vi, beforeEach } from "vitest"
import { navigateSidePanel } from "./helper"
import { BgData } from "@/services/backgroundData"
import { updateSidePanelUrl } from "@/services/chrome"

// Mock dependencies
vi.mock("@/services/backgroundData", () => ({
  BgData: {
    get: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock("@/services/chrome", () => ({
  updateSidePanelUrl: vi.fn(),
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
        sidePanelTabs: [123],
      } as any)

      const result = navigateSidePanel(param, sender)

      expect(result).toBe(false)
    })

    it("NSP-03: Should return false for javascript: protocol", () => {
      const param = { url: "javascript:alert('test')", tabId: 123 }
      const sender = {} as any

      vi.mocked(BgData.get).mockReturnValue({
        sidePanelTabs: [123],
      } as any)

      const result = navigateSidePanel(param, sender)

      expect(result).toBe(false)
    })

    it("NSP-04: Should return false for data: protocol", () => {
      const param = { url: "data:text/html,<h1>Test</h1>", tabId: 123 }
      const sender = {} as any

      vi.mocked(BgData.get).mockReturnValue({
        sidePanelTabs: [123],
      } as any)

      const result = navigateSidePanel(param, sender)

      expect(result).toBe(false)
    })

    it("NSP-05: Should return false when tab is not in sidePanelTabs", () => {
      const param = { url: "https://example.com", tabId: 123 }
      const sender = {} as any

      vi.mocked(BgData.get).mockReturnValue({
        sidePanelTabs: [456, 789], // Different tab IDs
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
        sidePanelTabs: [tabId],
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
        sidePanelTabs: [tabId],
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
        sidePanelTabs: [tabId],
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
})
