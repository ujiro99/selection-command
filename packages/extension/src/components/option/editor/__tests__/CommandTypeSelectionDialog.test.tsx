import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { CommandTypeSelectionDialog } from "../CommandTypeSelectionDialog"
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

const hubLink = () =>
  screen.getByText("Option_commandType_hubLink").closest("a") as HTMLElement

describe("CommandTypeSelectionDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("CTSD-01: sends hub_link_click with the command-type-dialog route when the Hub link is clicked", () => {
    render(
      <CommandTypeSelectionDialog
        open={true}
        onOpenChange={vi.fn()}
        onSelect={vi.fn()}
      />,
    )
    expect(mockSendHubLinkClick).not.toHaveBeenCalled()

    fireEvent.click(hubLink())

    expect(mockSendHubLinkClick).toHaveBeenCalledOnce()
    expect(mockSendHubLinkClick).toHaveBeenCalledWith("command-type-dialog")
  })
})
