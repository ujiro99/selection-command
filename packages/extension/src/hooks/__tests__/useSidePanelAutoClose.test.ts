import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { useSidePanelAutoClose } from "../useSidePanelAutoClose"
import { Ipc, ServiceWorkerCommand } from "@/services/ipc"
import { ServiceWorkerData } from "@/services/serviceWorkerData"

// Mock dependencies
vi.mock("@/services/ipc", () => ({
  Ipc: {
    send: vi.fn(),
  },
  ServiceWorkerCommand: {
    closeSidePanel: "closeSidePanel",
  },
}))

vi.mock("@/services/serviceWorkerData", () => ({
  ServiceWorkerData: {
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

const mockServiceWorkerDataGet = vi.mocked(ServiceWorkerData.get)
const mockServiceWorkerDataWatch = vi.mocked(ServiceWorkerData.watch)
const mockUseUserSettings = vi.mocked(useUserSettings)

const makeSettings = (windowAutoHide = false, linkCommandAutoHide = false) => ({
  userSettings: {
    windowOption: { sidePanelAutoHide: windowAutoHide },
    linkCommand: { sidePanelAutoHide: linkCommandAutoHide },
  },
})

describe("useSidePanelAutoClose", () => {
  let watchCallback: ((data: ServiceWorkerData) => void) | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    watchCallback = null

    // Default: side panel not visible
    mockServiceWorkerDataGet.mockReturnValue({
      sidePanelTabs: [],
    } as unknown as ServiceWorkerData)

    // Capture the watch callback so tests can trigger ServiceWorkerData updates
    mockServiceWorkerDataWatch.mockImplementation((cb) => {
      watchCallback = cb as (data: ServiceWorkerData) => void
      return () => {}
    })

    mockUseUserSettings.mockReturnValue(makeSettings() as any)
  })

  it("SPAC-01: Should not register click listener when side panel is not visible", async () => {
    const addSpy = vi.spyOn(window, "addEventListener")
    renderHook(() => useSidePanelAutoClose())
    await waitFor(() => {
      expect(mockServiceWorkerDataGet).toHaveBeenCalled()
    })
    expect(addSpy).not.toHaveBeenCalledWith("click", expect.any(Function))
  })

  it("SPAC-02: Should not register click listener when sidePanelAutoHide is false (windowOption)", async () => {
    mockServiceWorkerDataGet.mockReturnValue({
      sidePanelTabs: [{ tabId: 123, isLinkCommand: false }],
    } as unknown as ServiceWorkerData)
    mockUseUserSettings.mockReturnValue(makeSettings(false, false) as any)

    const addSpy = vi.spyOn(window, "addEventListener")
    renderHook(() => useSidePanelAutoClose())
    await waitFor(() => expect(mockServiceWorkerDataGet).toHaveBeenCalled())
    expect(addSpy).not.toHaveBeenCalledWith("click", expect.any(Function))
  })

  it("SPAC-03: Should register click listener when sidePanelAutoHide is true (windowOption, non-link-command)", async () => {
    mockServiceWorkerDataGet.mockReturnValue({
      sidePanelTabs: [{ tabId: 123, isLinkCommand: false }],
    } as unknown as ServiceWorkerData)
    mockUseUserSettings.mockReturnValue(makeSettings(true, false) as any)

    const addSpy = vi.spyOn(window, "addEventListener")
    renderHook(() => useSidePanelAutoClose())
    await waitFor(() =>
      expect(addSpy).toHaveBeenCalledWith("click", expect.any(Function)),
    )
  })

  it("SPAC-04: Should use linkCommand.sidePanelAutoHide when isLinkCommand is true", async () => {
    mockServiceWorkerDataGet.mockReturnValue({
      sidePanelTabs: [{ tabId: 123, isLinkCommand: true }],
    } as unknown as ServiceWorkerData)
    // windowOption.sidePanelAutoHide is false, linkCommand.sidePanelAutoHide is true
    mockUseUserSettings.mockReturnValue(makeSettings(false, true) as any)

    const addSpy = vi.spyOn(window, "addEventListener")
    renderHook(() => useSidePanelAutoClose())
    await waitFor(() =>
      expect(addSpy).toHaveBeenCalledWith("click", expect.any(Function)),
    )
  })

  it("SPAC-05: Should not register click listener when isLinkCommand but linkCommand.sidePanelAutoHide is false", async () => {
    mockServiceWorkerDataGet.mockReturnValue({
      sidePanelTabs: [{ tabId: 123, isLinkCommand: true }],
    } as unknown as ServiceWorkerData)
    // windowOption.sidePanelAutoHide is true, but linkCommand.sidePanelAutoHide is false
    mockUseUserSettings.mockReturnValue(makeSettings(true, false) as any)

    const addSpy = vi.spyOn(window, "addEventListener")
    renderHook(() => useSidePanelAutoClose())
    await waitFor(() => expect(mockServiceWorkerDataGet).toHaveBeenCalled())
    expect(addSpy).not.toHaveBeenCalledWith("click", expect.any(Function))
  })

  it("SPAC-06: Should send closeSidePanel when click occurs and auto-close is enabled", async () => {
    mockServiceWorkerDataGet.mockReturnValue({
      sidePanelTabs: [{ tabId: 123, isLinkCommand: false }],
    } as unknown as ServiceWorkerData)
    mockUseUserSettings.mockReturnValue(makeSettings(true, false) as any)

    renderHook(() => useSidePanelAutoClose())
    await waitFor(() =>
      expect(window.addEventListener).toHaveBeenCalledWith(
        "click",
        expect.any(Function),
      ),
    )

    window.dispatchEvent(new MouseEvent("click"))
    expect(Ipc.send).toHaveBeenCalledWith(ServiceWorkerCommand.closeSidePanel)
  })

  it("SPAC-07: Should update listener when ServiceWorkerData.watch fires with new data", async () => {
    // Initially side panel is not visible
    mockServiceWorkerDataGet.mockReturnValue({
      sidePanelTabs: [],
    } as unknown as ServiceWorkerData)
    mockUseUserSettings.mockReturnValue(makeSettings(true, false) as any)

    const addSpy = vi.spyOn(window, "addEventListener")
    renderHook(() => useSidePanelAutoClose())
    await waitFor(() => expect(mockServiceWorkerDataWatch).toHaveBeenCalled())

    // Listener should NOT be added yet
    expect(addSpy).not.toHaveBeenCalledWith("click", expect.any(Function))

    // Now simulate ServiceWorkerData update making the side panel visible
    await act(async () => {
      watchCallback?.({
        sidePanelTabs: [{ tabId: 123, isLinkCommand: false }],
      } as unknown as ServiceWorkerData)
    })

    await waitFor(() =>
      expect(addSpy).toHaveBeenCalledWith("click", expect.any(Function)),
    )
  })

  it("SPAC-08: Should remove click listener on cleanup", async () => {
    mockServiceWorkerDataGet.mockReturnValue({
      sidePanelTabs: [{ tabId: 123, isLinkCommand: false }],
    } as unknown as ServiceWorkerData)
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
