import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { OpenInTab } from "../OpenInTab"
import { Ipc, ServiceWorkerCommand } from "@/services/ipc"

type IpcResponses = Partial<Record<ServiceWorkerCommand, unknown>>

const mockIpc = (responses: IpcResponses) =>
  vi
    .spyOn(Ipc, "send")
    .mockImplementation(
      async (command: unknown) => responses[command as ServiceWorkerCommand],
    )

// The container is hidden until the CSS applies, so it has no accessible name
// in tests and the button is looked up by its label instead.
const getKeepOpenButton = async () =>
  (await screen.findByText("Keep Open")).closest("button") as HTMLButtonElement

describe("OpenInTab", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("OIT-01: shows no buttons outside a popup window", async () => {
    const send = mockIpc({ [ServiceWorkerCommand.canOpenInTab]: false })

    render(<OpenInTab />)

    await waitFor(() =>
      expect(send).toHaveBeenCalledWith(ServiceWorkerCommand.canOpenInTab),
    )
    expect(screen.queryByRole("button", { hidden: true })).toBeNull()
    expect(send).not.toHaveBeenCalledWith(ServiceWorkerCommand.getPopupKeepOpen)
  })

  it("OIT-02: restores the keep open state after a page navigation", async () => {
    mockIpc({
      [ServiceWorkerCommand.canOpenInTab]: true,
      [ServiceWorkerCommand.getPopupKeepOpen]: true,
    })

    render(<OpenInTab />)

    const button = await getKeepOpenButton()
    await waitFor(() =>
      expect(button.getAttribute("aria-pressed")).toBe("true"),
    )
  })

  it("OIT-03: toggles the keep open state on click", async () => {
    const send = mockIpc({
      [ServiceWorkerCommand.canOpenInTab]: true,
      [ServiceWorkerCommand.getPopupKeepOpen]: false,
      [ServiceWorkerCommand.setPopupKeepOpen]: true,
    })

    render(<OpenInTab />)
    const button = await getKeepOpenButton()
    await waitFor(() =>
      expect(send).toHaveBeenCalledWith(ServiceWorkerCommand.getPopupKeepOpen),
    )

    fireEvent.click(button)

    expect(send).toHaveBeenCalledWith(ServiceWorkerCommand.setPopupKeepOpen, {
      keepOpen: true,
    })
    await waitFor(() =>
      expect(button.getAttribute("aria-pressed")).toBe("true"),
    )
  })
})
