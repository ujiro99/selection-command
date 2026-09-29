import { describe, it, expect, vi, beforeEach } from "vitest"
import { isSidePanel } from "../sidePanelDetector"
import { ServiceWorkerData } from "../serviceWorkerData"

// Mock dependencies
vi.mock("../serviceWorkerData", () => ({
  ServiceWorkerData: {
    get: vi.fn(),
  },
}))

describe("sidePanelDetector", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("isSidePanel", () => {
    it("SPD-01: Should return false when tabId has a value (not a side panel context)", () => {
      const result = isSidePanel(123, 456)

      expect(result).toBe(false)
      // ServiceWorkerData.get should NOT be called because we can early-return
      expect(ServiceWorkerData.get).not.toHaveBeenCalled()
    })

    it("SPD-01-a: Should continue checking when tabId is undefined (treated same as null)", () => {
      vi.mocked(ServiceWorkerData.get).mockReturnValue({
        sidePanelTabs: [{ tabId: 789, isLinkCommand: false }],
      } as any)

      const result = isSidePanel(undefined, 789)

      expect(result).toBe(true)
    })

    it("SPD-02: Should return false when activeTabId is null", () => {
      const result = isSidePanel(null, null)

      expect(result).toBe(false)
    })

    it("SPD-03: Should return false when activeTabId is not in sidePanelTabs", () => {
      vi.mocked(ServiceWorkerData.get).mockReturnValue({
        sidePanelTabs: [{ tabId: 789, isLinkCommand: false }], // activeTabId not in list
      } as any)

      const result = isSidePanel(null, 456)

      expect(result).toBe(false)
      expect(ServiceWorkerData.get).toHaveBeenCalledTimes(1)
    })

    it("SPD-04: Should return true when all conditions are met", () => {
      vi.mocked(ServiceWorkerData.get).mockReturnValue({
        sidePanelTabs: [{ tabId: 456, isLinkCommand: false }],
      } as any)

      const result = isSidePanel(null, 456)

      expect(result).toBe(true)
    })
  })
})
