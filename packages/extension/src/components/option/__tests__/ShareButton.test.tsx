import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ShareButton } from "../ShareButton"
import { sendEvent, sendHubLinkClick } from "@/services/analytics"
import { shareCommandToHub, isHubRegistered } from "@/services/hubShare"
import { OPEN_MODE } from "@/const"
import { TEST_IDS } from "@/testIds"
import type { SearchCommand } from "@/types"

vi.mock("@/services/i18n", () => ({
  t: (key: string) => key,
}))

vi.mock("@/components/Tooltip", () => ({
  Tooltip: () => null,
}))

vi.mock("@/services/hubShare", () => ({
  shareCommandToHub: vi.fn(),
  getHubLocale: () => "en",
  isHubShareable: () => true,
  isHubRegistered: vi.fn(),
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

const mockSendEvent = vi.mocked(sendEvent)
const mockSendHubLinkClick = vi.mocked(sendHubLinkClick)
const mockShareCommandToHub = vi.mocked(shareCommandToHub)
const mockIsHubRegistered = vi.mocked(isHubRegistered)

// A UUIDv7 id, so that sharing does not regenerate the command id.
const command: SearchCommand = {
  id: "018f4e5a-7b3c-7d2e-8f1a-9b0c1d2e3f4a",
  title: "Test Command",
  iconUrl: "https://example.com/icon.png",
  openMode: OPEN_MODE.POPUP,
  searchUrl: "https://google.com/search?q=%s",
}

describe("ShareButton", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockShareCommandToHub.mockReturnValue(true)
    chrome.tabs.create = vi.fn()
  })

  it("SB-01: opens the Hub dashboard and sends hub_link_click for an already shared command", () => {
    render(<ShareButton command={command} isShared />)

    fireEvent.click(screen.getByTestId(TEST_IDS.sharedCommandButton))

    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: expect.stringContaining(`mycommands?id=${command.id}`),
    })
    expect(mockSendHubLinkClick).toHaveBeenCalledOnce()
    expect(mockSendHubLinkClick).toHaveBeenCalledWith("share-button")
    expect(mockShareCommandToHub).not.toHaveBeenCalled()
    expect(mockSendEvent).not.toHaveBeenCalled()
  })

  it("SB-02: sends hub_link_click instead of command_share for an unregistered user", async () => {
    mockIsHubRegistered.mockResolvedValue(false)
    render(<ShareButton command={command} />)

    fireEvent.click(screen.getByTestId(TEST_IDS.shareCommandButton))

    await waitFor(() =>
      expect(mockSendHubLinkClick).toHaveBeenCalledWith("share-button"),
    )
    expect(mockSendHubLinkClick).toHaveBeenCalledOnce()
    expect(mockShareCommandToHub).toHaveBeenCalledWith(command)
    expect(mockSendEvent).not.toHaveBeenCalled()
  })

  it("SB-03: sends command_share but not hub_link_click for a registered user", async () => {
    mockIsHubRegistered.mockResolvedValue(true)
    render(<ShareButton command={command} />)

    fireEvent.click(screen.getByTestId(TEST_IDS.shareCommandButton))

    await waitFor(() =>
      expect(mockSendEvent).toHaveBeenCalledWith(
        "command_share",
        { event_label: "share-button" },
        expect.anything(),
      ),
    )
    expect(mockSendHubLinkClick).not.toHaveBeenCalled()
  })

  it("SB-04: sends no event when the share request fails", async () => {
    mockShareCommandToHub.mockReturnValue(false)
    render(<ShareButton command={command} />)

    fireEvent.click(screen.getByTestId(TEST_IDS.shareCommandButton))

    await waitFor(() => expect(mockShareCommandToHub).toHaveBeenCalled())
    expect(mockIsHubRegistered).not.toHaveBeenCalled()
    expect(mockSendHubLinkClick).not.toHaveBeenCalled()
    expect(mockSendEvent).not.toHaveBeenCalled()
  })
})
