import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { showHubShareToast } from "./HubShareToast"
import { sendEvent } from "@/services/analytics"
import { shareCommandToHub } from "@/services/hubShare"
import { OPEN_MODE } from "@/const"
import type { SearchCommand } from "@/types"

vi.mock("sonner", () => ({
  toast: {
    custom: vi.fn(),
    dismiss: vi.fn(),
  },
}))

vi.mock("@/services/i18n", () => ({
  t: vi.fn((key: string) => {
    const translations: Record<string, string> = {
      hub_share_toast_message: "Share this command to the Hub?",
      hub_share_toast_later: "Later",
      hub_share_toast_button: "Share",
    }
    return translations[key] || key
  }),
}))

vi.mock("@/services/analytics", () => ({
  ANALYTICS_EVENTS: {
    OPEN_DIALOG: "open_dialog",
    COMMAND_SHARE: "command_share",
  },
  sendEvent: vi.fn(),
}))

vi.mock("@/services/hubShare", () => ({
  shareCommandToHub: vi.fn(),
}))

const mockToastCustom = vi.mocked(toast.custom)
const mockToastDismiss = vi.mocked(toast.dismiss)
const mockSendEvent = vi.mocked(sendEvent)
const mockShareCommandToHub = vi.mocked(shareCommandToHub)

const command: SearchCommand = {
  id: "cmd-1",
  title: "Test Command",
  iconUrl: "https://example.com/icon.png",
  openMode: OPEN_MODE.POPUP,
  searchUrl: "https://google.com/search?q=%s",
}

// Renders the JSX passed to toast.custom() so its buttons can be interacted with.
function renderToastBody(toastId: string | number = "toast-1") {
  const [renderFn] = mockToastCustom.mock.calls[0]
  return render(<>{renderFn(toastId)}</>)
}

describe("showHubShareToast", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("HST-01: sends an open_dialog analytics event", () => {
    showHubShareToast(command, vi.fn())

    expect(mockSendEvent).toHaveBeenCalledWith(
      "open_dialog",
      { event_label: "hub_share_toast" },
      expect.anything(),
    )
  })

  it("HST-02: calls toast.custom with a 60 second duration", () => {
    showHubShareToast(command, vi.fn())

    expect(mockToastCustom).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ duration: 60 * 1000 }),
    )
  })

  it("HST-03: renders the message and both buttons", () => {
    showHubShareToast(command, vi.fn())
    renderToastBody()

    expect(
      screen.getByText("Share this command to the Hub?"),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Later" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Share/ })).toBeInTheDocument()
  })

  it("HST-04: clicking 'Later' dismisses the toast and calls onShown without sharing", async () => {
    const user = userEvent.setup()
    const onShown = vi.fn()
    showHubShareToast(command, onShown)
    renderToastBody("toast-1")

    await user.click(screen.getByRole("button", { name: "Later" }))

    expect(mockToastDismiss).toHaveBeenCalledWith("toast-1")
    expect(onShown).toHaveBeenCalledOnce()
    expect(mockShareCommandToHub).not.toHaveBeenCalled()
  })

  it("HST-05: clicking 'Share' shares the command, dismisses the toast, and calls onShown", async () => {
    const user = userEvent.setup()
    const onShown = vi.fn()
    showHubShareToast(command, onShown)
    renderToastBody("toast-1")

    await user.click(screen.getByRole("button", { name: /Share/ }))

    expect(mockShareCommandToHub).toHaveBeenCalledWith(command)
    expect(mockSendEvent).toHaveBeenCalledWith(
      "command_share",
      { event_label: "hub-share-toast" },
      expect.anything(),
    )
    expect(mockToastDismiss).toHaveBeenCalledWith("toast-1")
    expect(onShown).toHaveBeenCalledOnce()
  })

  it("HST-06: calls onShown when the toast auto-closes via timeout", () => {
    const onShown = vi.fn()
    showHubShareToast(command, onShown)

    const [, options] = mockToastCustom.mock.calls[0]
    options?.onAutoClose?.({} as never)

    expect(onShown).toHaveBeenCalledOnce()
  })
})
