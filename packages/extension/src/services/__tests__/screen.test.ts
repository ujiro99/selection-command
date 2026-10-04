import { describe, it, expect, vi, beforeEach } from "vitest"
import { getScreenSize, getCenteredOffsetInCurrentWindow } from "../screen"

// Mock isServiceWorker to control context
vi.mock("@/lib/utils", () => ({
  isServiceWorker: vi.fn(),
}))

import { isServiceWorker } from "@/lib/utils"

// Minimal display info structure for testing
const makeDisplay = (
  left: number,
  top: number,
  width: number,
  height: number,
  isPrimary = false,
): chrome.system.display.DisplayUnitInfo =>
  ({
    id: `display-${left}`,
    name: `Display ${left}`,
    isPrimary,
    isEnabled: true,
    bounds: { left, top, width, height },
    workArea: { left, top, width, height },
    overscan: { left: 0, top: 0, right: 0, bottom: 0 },
    rotation: 0,
    dpiX: 96,
    dpiY: 96,
    mirroringSourceId: "",
    mirroringDestinationIds: [],
    isUnified: false,
    activeState: "active",
    displayZoomFactor: 1,
  }) as unknown as chrome.system.display.DisplayUnitInfo

describe("getScreenSize", () => {
  const primaryDisplay = makeDisplay(0, 0, 1920, 1080, true)
  const secondaryDisplay = makeDisplay(1920, 0, 2560, 1440, false)

  let mockGetInfo: ReturnType<typeof vi.fn>
  let mockGetCurrent: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    mockGetInfo = vi.fn().mockResolvedValue([primaryDisplay, secondaryDisplay])
    mockGetCurrent = vi
      .fn()
      .mockResolvedValue({ left: 100, top: 100 } as chrome.windows.Window)

    vi.stubGlobal("chrome", {
      system: {
        display: {
          getInfo: mockGetInfo,
        },
      },
      windows: {
        getCurrent: mockGetCurrent,
      },
    })
  })

  describe("In service worker context", () => {
    beforeEach(() => {
      vi.mocked(isServiceWorker).mockReturnValue(true)
    })

    it("GSS-01: ヒントなし - getCurrent() の結果からディスプレイを特定する", async () => {
      // getCurrent returns position on primary display
      mockGetCurrent.mockResolvedValue({
        left: 100,
        top: 100,
      } as chrome.windows.Window)

      const result = await getScreenSize()

      expect(result.left).toBe(0)
      expect(result.top).toBe(0)
      expect(result.width).toBe(1920)
      expect(result.height).toBe(1080)
    })

    it("GSS-02: ヒントあり（プライマリディスプレイ上の座標）- プライマリディスプレイを返す", async () => {
      const result = await getScreenSize({ top: 200, left: 300 })

      // Should identify primary display (0,0,1920,1080)
      expect(result.left).toBe(0)
      expect(result.top).toBe(0)
      expect(result.width).toBe(1920)
      expect(result.height).toBe(1080)
      // getCurrent should NOT be called when hint is provided
      expect(mockGetCurrent).not.toHaveBeenCalled()
    })

    it("GSS-03: ヒントあり（セカンダリディスプレイ上の座標）- セカンダリディスプレイを返す", async () => {
      // Position on secondary display (left=1920, right=4480)
      const result = await getScreenSize({ top: 100, left: 2000 })

      // Should identify secondary display (1920,0,2560,1440)
      expect(result.left).toBe(1920)
      expect(result.top).toBe(0)
      expect(result.width).toBe(2560)
      expect(result.height).toBe(1440)
      // getCurrent should NOT be called when hint is provided
      expect(mockGetCurrent).not.toHaveBeenCalled()
    })

    it("GSS-04: マルチディスプレイ環境でヒントがプライマリにない場合もセカンダリを正しく返す", async () => {
      // Simulate: getCurrent returns primary window, but popup hint is on secondary display
      mockGetCurrent.mockResolvedValue({
        left: 100, // on primary display
        top: 100,
      } as chrome.windows.Window)

      const result = await getScreenSize({ top: 500, left: 3000 })

      // Should correctly identify secondary display, not primary
      expect(result.left).toBe(1920)
      expect(result.top).toBe(0)
      expect(result.width).toBe(2560)
      expect(result.height).toBe(1440)
    })

    it("GSS-05: ヒントがいずれのディスプレイにも含まれず、現在ウィンドウも特定できない場合、プライマリを返す", async () => {
      // Current window is also outside every display
      mockGetCurrent.mockResolvedValue({
        left: -5000,
        top: -5000,
        width: 800,
        height: 600,
      } as chrome.windows.Window)

      const result = await getScreenSize({ top: -100, left: -200 })

      // Should fall back to primary display
      expect(result.left).toBe(0)
      expect(result.top).toBe(0)
      expect(result.width).toBe(1920)
      expect(result.height).toBe(1080)
    })

    it("GSS-07: ヒントが画面外の場合、現在ウィンドウのディスプレイを返す", async () => {
      // Current window is on the secondary display
      mockGetCurrent.mockResolvedValue({
        left: 2000,
        top: 100,
        width: 1200,
        height: 900,
      } as chrome.windows.Window)

      // Off-screen hint (e.g. window position + large offset)
      const result = await getScreenSize({ top: 10100, left: 12000 })

      expect(result.left).toBe(1920)
      expect(result.top).toBe(0)
      expect(result.width).toBe(2560)
      expect(result.height).toBe(1440)
    })

    it("GSS-08: 最大化ウィンドウ（左上がディスプレイ外）でもウィンドウ中心でディスプレイを特定する", async () => {
      // Maximized window on the secondary display (Windows adds -8px)
      mockGetCurrent.mockResolvedValue({
        left: 1912,
        top: -8,
        width: 2576,
        height: 1456,
      } as chrome.windows.Window)

      const result = await getScreenSize()

      expect(result.left).toBe(1920)
      expect(result.width).toBe(2560)
    })

    it("GSS-09: ヒントが画面外で getCurrent() が失敗した場合、プライマリを返す", async () => {
      mockGetCurrent.mockRejectedValue(new Error("No window"))

      const result = await getScreenSize({ top: 10000, left: 10000 })

      expect(result.left).toBe(0)
      expect(result.width).toBe(1920)
    })
  })

  describe("In content script context (non-service-worker)", () => {
    beforeEach(() => {
      vi.mocked(isServiceWorker).mockReturnValue(false)

      // Mock window.screen
      vi.stubGlobal("window", {
        screen: {
          width: 1920,
          height: 1080,
          availLeft: 0,
          availTop: 0,
        },
      })
    })

    it("GSS-06: window.screen の値を返す（ヒントは無視）", async () => {
      const result = await getScreenSize({ top: 500, left: 3000 })

      expect(result.width).toBe(1920)
      expect(result.height).toBe(1080)
    })
  })
})

describe("getCenteredOffsetInCurrentWindow", () => {
  let mockGetCurrent: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetCurrent = vi.fn()
    vi.stubGlobal("chrome", {
      windows: {
        getCurrent: mockGetCurrent,
      },
    })
  })

  it("GCO-01: ポップアップをウィンドウ中央に配置するオフセットを返す", async () => {
    mockGetCurrent.mockResolvedValue({
      left: 1920,
      top: 0,
      width: 1600,
      height: 1000,
    } as chrome.windows.Window)

    const result = await getCenteredOffsetInCurrentWindow({
      width: 600,
      height: 700,
    })

    expect(result).toEqual({ x: 500, y: 150 })
  })

  it("GCO-02: ポップアップがウィンドウより大きい場合、ウィンドウ中心を返す", async () => {
    mockGetCurrent.mockResolvedValue({
      left: 1920,
      top: 0,
      width: 500,
      height: 400,
    } as chrome.windows.Window)

    const result = await getCenteredOffsetInCurrentWindow({
      width: 600,
      height: 700,
    })

    expect(result).toEqual({ x: 250, y: 200 })
  })

  it("GCO-03: getCurrent() が失敗した場合、{ x: 0, y: 0 } を返す", async () => {
    mockGetCurrent.mockRejectedValue(new Error("No window"))

    const result = await getCenteredOffsetInCurrentWindow({
      width: 600,
      height: 700,
    })

    expect(result).toEqual({ x: 0, y: 0 })
  })
})
