import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { HubBanner } from "../HubBanner"
import { sendHubLinkClick } from "@/services/analytics"

vi.mock("@/services/i18n", () => ({
  t: (key: string) => key,
}))

vi.mock("@/hooks/option/useHubUser", () => ({
  useHubUser: vi.fn(() => null),
}))

vi.mock("@/services/hubShare", () => ({
  getHubLocale: () => "en",
}))

vi.mock("@/services/analytics", () => ({
  ANALYTICS_EVENTS: { COMMAND_SHARE: "command_share" },
  HUB_LINK_ROUTE: {
    BANNER: "banner",
    LOGIN: "login",
    COMMAND_TYPE_DIALOG: "command-type-dialog",
    SHARE_BUTTON: "share-button",
    SHARE_TOAST: "share-toast",
  },
  sendEvent: vi.fn(),
  sendHubLinkClick: vi.fn(),
}))

const mockSendHubLinkClick = vi.mocked(sendHubLinkClick)

describe("HubBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("HB-01: does not send hub_link_click until the banner is clicked", () => {
    render(<HubBanner />)

    expect(mockSendHubLinkClick).not.toHaveBeenCalled()
  })

  it("HB-02: sends hub_link_click with the banner route on click", () => {
    render(<HubBanner />)

    fireEvent.click(screen.getByRole("link"))

    expect(mockSendHubLinkClick).toHaveBeenCalledOnce()
    expect(mockSendHubLinkClick).toHaveBeenCalledWith("banner")
  })
})
