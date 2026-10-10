import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { HubUserInfo } from "../HubUserInfo"
import { useHubUser } from "@/hooks/option/useHubUser"
import { sendHubLinkClick } from "@/services/analytics"

vi.mock("@/services/i18n", () => ({
  t: (key: string) => key,
}))

vi.mock("@/hooks/option/useHubUser", () => ({
  useHubUser: vi.fn(() => null),
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

const mockUseHubUser = vi.mocked(useHubUser)
const mockSendHubLinkClick = vi.mocked(sendHubLinkClick)

describe("HubUserInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseHubUser.mockReturnValue(null)
  })

  it("HUI-01: sends hub_link_click with the login route when the login link is clicked", () => {
    render(<HubUserInfo />)

    fireEvent.click(screen.getByRole("link"))

    expect(mockSendHubLinkClick).toHaveBeenCalledOnce()
    expect(mockSendHubLinkClick).toHaveBeenCalledWith("login")
  })

  it("HUI-02: shows no login link for a signed-in user", () => {
    mockUseHubUser.mockReturnValue({
      name: "tester",
      image: "https://example.com/avatar.png",
    } as ReturnType<typeof useHubUser>)
    render(<HubUserInfo />)

    expect(screen.queryByRole("link")).not.toBeInTheDocument()
    expect(mockSendHubLinkClick).not.toHaveBeenCalled()
  })
})
