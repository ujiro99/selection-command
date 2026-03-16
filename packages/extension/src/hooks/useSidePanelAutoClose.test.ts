import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { useSidePanelAutoClose } from "./useSidePanelAutoClose"
import { Ipc, BgCommand } from "@/services/ipc"
import { BgData } from "@/services/backgroundData"

// Mock dependencies
vi.mock("@/services/ipc", () => ({
  Ipc: {
    send: vi.fn(),
  },
  BgCommand: {
    closeSidePanel: "closeSidePanel",
  },
}))

vi.mock("@/services/backgroundData", () => ({
  BgData: {
    get: vi.fn(),
    watch: vi.fn(),
  },
}))

vi.mock("@/hooks/useTabContext", () => ({
  useTabContext: () => ({ tabId: 123 }),
}))

vi.mock("@/hooks/useSettings", () => ({
  useUserSettings: vi.fn(),
}))

import { useUserSettings } from "@/hooks/useSettings"

const mockBgDataGet = vi.mocked(BgData.get)
const mockBgDataWatch = vi.mocked(BgData.watch)
const mockUseUserSettings = vi.mocked(useUserSettings)

const makeSettings = (
  windowAutoHide = false,
  linkCommandAutoHide = false,
) => ({
  userSettings: {
    windowOption: { sidePanelAutoHide: windowAutoHide },
    linkCommand: { sidePanelAutoHide: linkCommandAutoHide },
  },
})

describe("useSidePanelAutoClose", () => {
  let watchCallback: ((data: BgData) => void) | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    watchCallback = null

    // Default: side panel not visible
    mockBgDataGet.mockReturnValue({
      sidePanelTabs: [],
    } as unknown as BgData)

    // Capture the watch callback so tests can trigger BgData updates
    mockBgDataWatch.mockImplementation((cb) => {
      watchCallback = cb as (data: BgData) => void
      return () => {}
    })

    mockUseUserSettings.mockReturnValue(makeSettings() as any)
  })

  it("SPAC-01: Should not register click listener when side panel is not visible", async () => {
    const addSpy = vi.spyOn(window, "addEventListener")
    renderHook(() => useSidePanelAutoClose())
    await waitFor(() => {
      expect(mockBgDataGet).toHaveBeenCalled()
    })
    expect(addSpy).not.toHaveBeenCalledWith("click", expect.any(Function))
  })

  it("SPAC-02: Should not register click listener when sidePanelAutoHide is false (windowOption)", async () => {
    mockBgDataGet.mockReturnValue({
      sidePanelTabs: [{ tabId: 123, isLinkCommand: false }],
    } as unknown as BgData)
    mockUseUserSettings.mockReturnValue(makeSettings(false, false) as any)

    const addSpy = vi.spyOn(window, "addEventListener")
    renderHook(() => useSidePanelAutoClose())
    await waitFor(() => expect(mockBgDataGet).toHaveBeenCalled())
    expect(addSpy).not.toHaveBeenCalledWith("click", expect.any(Function))
  })

  it("SPAC-03: Should register click listener when sidePanelAutoHide is true (windowOption, non-link-command)", async () => {
    mockBgDataGet.mockReturnValue({
      sidePanelTabs: [{ tabId: 123, isLinkCommand: false }],
    } as unknown as BgData)
    mockUseUserSettings.mockReturnValue(makeSettings(true, false) as any)

    const addSpy = vi.spyOn(window, "addEventListener")
    renderHook(() => useSidePanelAutoClose())
    await waitFor(() =>
      expect(addSpy).toHaveBeenCalledWith("click", expect.any(Function)),
    )
  })

  it("SPAC-04: Should use linkCommand.sidePanelAutoHide when isLinkCommand is true", async () => {
    mockBgDataGet.mockReturnValue({
      sidePanelTabs: [{ tabId: 123, isLinkCommand: true }],
    } as unknown as BgData)
    // windowOption.sidePanelAutoHide is false, linkCommand.sidePanelAutoHide is true
    mockUseUserSettings.mockReturnValue(makeSettings(false, true) as any)

    const addSpy = vi.spyOn(window, "addEventListener")
    renderHook(() => useSidePanelAutoClose())
    await waitFor(() =>
      expect(addSpy).toHaveBeenCalledWith("click", expect.any(Function)),
    )
  })

  it("SPAC-05: Should not register click listener when isLinkCommand but linkCommand.sidePanelAutoHide is false", async () => {
    mockBgDataGet.mockReturnValue({
      sidePanelTabs: [{ tabId: 123, isLinkCommand: true }],
    } as unknown as BgData)
    // windowOption.sidePanelAutoHide is true, but linkCommand.sidePanelAutoHide is false
    mockUseUserSettings.mockReturnValue(makeSettings(true, false) as any)

    const addSpy = vi.spyOn(window, "addEventListener")
    renderHook(() => useSidePanelAutoClose())
    await waitFor(() => expect(mockBgDataGet).toHaveBeenCalled())
    expect(addSpy).not.toHaveBeenCalledWith("click", expect.any(Function))
  })

  it("SPAC-06: Should send closeSidePanel when click occurs and auto-close is enabled", async () => {
    mockBgDataGet.mockReturnValue({
      sidePanelTabs: [{ tabId: 123, isLinkCommand: false }],
    } as unknown as BgData)
    mockUseUserSettings.mockReturnValue(makeSettings(true, false) as any)

    renderHook(() => useSidePanelAutoClose())
    await waitFor(() =>
      expect(window.addEventListener).toHaveBeenCalledWith(
        "click",
        expect.any(Function),
      ),
    )

    window.dispatchEvent(new MouseEvent("click"))
    expect(Ipc.send).toHaveBeenCalledWith(BgCommand.closeSidePanel)
  })

  it("SPAC-07: Should update listener when BgData.watch fires with new data", async () => {
    // Initially side panel is not visible
    mockBgDataGet.mockReturnValue({
      sidePanelTabs: [],
    } as unknown as BgData)
    mockUseUserSettings.mockReturnValue(makeSettings(true, false) as any)

    const addSpy = vi.spyOn(window, "addEventListener")
    renderHook(() => useSidePanelAutoClose())
    await waitFor(() => expect(mockBgDataWatch).toHaveBeenCalled())

    // Listener should NOT be added yet
    expect(addSpy).not.toHaveBeenCalledWith("click", expect.any(Function))

    // Now simulate BgData update making the side panel visible
    await act(async () => {
      watchCallback?.({
        sidePanelTabs: [{ tabId: 123, isLinkCommand: false }],
      } as unknown as BgData)
    })

    await waitFor(() =>
      expect(addSpy).toHaveBeenCalledWith("click", expect.any(Function)),
    )
  })

  it("SPAC-08: Should remove click listener on cleanup", async () => {
    mockBgDataGet.mockReturnValue({
      sidePanelTabs: [{ tabId: 123, isLinkCommand: false }],
    } as unknown as BgData)
    mockUseUserSettings.mockReturnValue(makeSettings(true, false) as any)

    const removeSpy = vi.spyOn(window, "removeEventListener")
    const { unmount } = renderHook(() => useSidePanelAutoClose())
    await waitFor(() =>
      expect(window.addEventListener).toHaveBeenCalledWith(
        "click",
        expect.any(Function),
      ),
    )

    unmount()
    expect(removeSpy).toHaveBeenCalledWith("click", expect.any(Function))
  })
})
