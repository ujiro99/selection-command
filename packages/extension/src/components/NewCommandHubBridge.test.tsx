import { render } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NewCommandHubBridge } from "./NewCommandHubBridge"
import { useCommandHubBridge } from "@/hooks/useCommandHubBridge"
import { sendEvent } from "@/services/analytics"

vi.mock("@/hooks/useCommandHubBridge", () => ({
  useCommandHubBridge: vi.fn(),
}))

vi.mock("@/services/analytics", () => ({
  ANALYTICS_EVENTS: {
    HUB_SCREEN_OPENED: "hub_screen_opened",
  },
  sendEvent: vi.fn(),
}))

const mockUseCommandHubBridge = vi.mocked(useCommandHubBridge)
const mockSendEvent = vi.mocked(sendEvent)

describe("NewCommandHubBridge: hub_screen_opened analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("NCH-01: activates the hub bridge hook and sends the event once", () => {
    render(<NewCommandHubBridge />)

    expect(mockUseCommandHubBridge).toHaveBeenCalled()
    expect(mockSendEvent).toHaveBeenCalledTimes(1)
    expect(mockSendEvent).toHaveBeenCalledWith(
      "hub_screen_opened",
      {},
      "CommandHub",
    )
  })
})
