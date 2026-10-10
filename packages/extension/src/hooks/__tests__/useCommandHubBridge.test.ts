import { renderHook } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useCommandHubBridge } from "../useCommandHubBridge"
import { useSection } from "@/hooks/useSettings"

vi.mock("@/hooks/useSettings", () => ({
  useSection: vi.fn(),
}))

const mockUseSection = vi.mocked(useSection)

describe("useCommandHubBridge", () => {
  let postMessage: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    postMessage = vi.spyOn(window, "postMessage").mockImplementation(() => {})
  })

  it("CHB-01: posts installed IDs and commands with contentUpdatedAt", () => {
    mockUseSection.mockReturnValue({
      data: [
        { id: "a", contentUpdatedAt: "2026-01-01T00:00:00.000Z" },
        { id: "b" },
      ],
    } as any)

    renderHook(() => useCommandHubBridge())

    expect(postMessage).toHaveBeenCalledWith(
      {
        action: "SyncInstalledCommand",
        installedCommands: [
          { id: "a", contentUpdatedAt: "2026-01-01T00:00:00.000Z" },
          { id: "b" },
        ],
      },
      window.location.origin,
    )
  })

  it("CHB-02: does not post before commands are loaded", () => {
    mockUseSection.mockReturnValue({ data: undefined } as any)

    renderHook(() => useCommandHubBridge())

    expect(postMessage).not.toHaveBeenCalled()
  })
})
