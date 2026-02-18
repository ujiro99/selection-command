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
      const result = isSidePanel(null)

      expect(result).toBe(false)
    })

    it("SPD-01-a: Should return false when tabId is undefined", () => {
      const result = isSidePanel(undefined)

      expect(result).toBe(false)
    })

    it("SPD-02: Should return false when tab is not in sidePanelTabs", () => {
      const tabId = 123
      vi.mocked(BgData.get).mockReturnValue({
        sidePanelTabs: [456, 789], // Different tab IDs
      } as any)

      const result = isSidePanel(tabId)

      expect(result).toBe(false)
      expect(BgData.get).toHaveBeenCalledTimes(1)
    })

    it("SPD-03: Should return false when window size is not side panel-like", () => {
      const tabId = 123
      vi.mocked(BgData.get).mockReturnValue({
        sidePanelTabs: [123],
      } as any)

      // Mock large window (not side panel size)
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1920,
      })
      Object.defineProperty(window, "innerHeight", {
        writable: true,
        configurable: true,
        value: 1080,
      })

      const result = isSidePanel(tabId)

      expect(result).toBe(false)
    })

    it("SPD-04: Should return true when all conditions are met", () => {
      const tabId = 123
      vi.mocked(BgData.get).mockReturnValue({
        sidePanelTabs: [123],
      } as any)

      // Mock side panel size (narrow vertical window)
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 400,
      })
      Object.defineProperty(window, "innerHeight", {
        writable: true,
        configurable: true,
        value: 800,
      })

      const result = isSidePanel(tabId)

      expect(result).toBe(true)
    })

    it("SPD-05: Should return false when width >= 600px", () => {
      const tabId = 123
      vi.mocked(BgData.get).mockReturnValue({
        sidePanelTabs: [123],
      } as any)

      // Width is 600px (boundary)
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 600,
      })
      Object.defineProperty(window, "innerHeight", {
        writable: true,
        configurable: true,
        value: 800,
      })

      const result = isSidePanel(tabId)

      expect(result).toBe(false)
    })

    it("SPD-06: Should return false when height <= width", () => {
      const tabId = 123
      vi.mocked(BgData.get).mockReturnValue({
        sidePanelTabs: [123],
      } as any)

      // Height is less than width
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 500,
      })
      Object.defineProperty(window, "innerHeight", {
        writable: true,
        configurable: true,
        value: 400,
      })

      const result = isSidePanel(tabId)

      expect(result).toBe(false)
    })
  })
})
