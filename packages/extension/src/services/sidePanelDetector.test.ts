import { describe, it, expect, vi, beforeEach } from "vitest"
import { isSidePanel } from "./sidePanelDetector"
import { BgData } from "./backgroundData"

// Mock dependencies
vi.mock("./backgroundData", () => ({
  BgData: {
    get: vi.fn(),
  },
}))

describe("sidePanelDetector", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("isSidePanel", () => {
    it("SPD-01: Should return false when tabId is null", () => {
      const result = isSidePanel(null, 123)

      expect(result).toBe(false)
    })

    it("SPD-01-a: Should return false when tabId is undefined", () => {
      const result = isSidePanel(undefined, 123)

      expect(result).toBe(false)
    })

    it("SPD-02: Should return false when activeTabId is null", () => {
      const result = isSidePanel(123, null)

      expect(result).toBe(false)
    })

    it("SPD-03: Should return false when activeTabId is not in sidePanelTabs", () => {
      const tabId = 123
      const activeTabId = 456
      vi.mocked(BgData.get).mockReturnValue({
        sidePanelTabs: [789], // Different tab ID
      } as any)

      const result = isSidePanel(tabId, activeTabId)

      expect(result).toBe(false)
      expect(BgData.get).toHaveBeenCalledTimes(1)
    })

    it("SPD-04: Should return true when all conditions are met", () => {
      const tabId = 123
      const activeTabId = 456
      vi.mocked(BgData.get).mockReturnValue({
        sidePanelTabs: [456],
      } as any)

      const result = isSidePanel(tabId, activeTabId)

      expect(result).toBe(true)
    })
  })
})
