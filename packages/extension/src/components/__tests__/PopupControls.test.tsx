import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { PopupControls } from "../PopupControls"
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

describe("PopupControls", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("OIT-01: shows no buttons outside a popup window", async () => {
    const send = mockIpc({ [ServiceWorkerCommand.canOpenInTab]: false })

    render(<PopupControls />)

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

    render(<PopupControls />)

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

    render(<PopupControls />)
    const button = await getKeepOpenButton()
    await waitFor(() => expect(button.disabled).toBe(false))

    fireEvent.click(button)

    expect(send).toHaveBeenCalledWith(ServiceWorkerCommand.setPopupKeepOpen, {
      keepOpen: true,
    })
    await waitFor(() =>
      expect(button.getAttribute("aria-pressed")).toBe("true"),
    )
  })

  it("OIT-04: ignores clicks until the initial state arrives", async () => {
    let resolveState!: (value: boolean) => void
    const send = vi.spyOn(Ipc, "send").mockImplementation(async (command) => {
      if (command === ServiceWorkerCommand.canOpenInTab) return true
      return new Promise((resolve) => {
        resolveState = resolve
      })
    })

    render(<PopupControls />)
    const button = await getKeepOpenButton()
    await waitFor(() =>
      expect(send).toHaveBeenCalledWith(ServiceWorkerCommand.getPopupKeepOpen),
    )

    fireEvent.click(button)
    expect(send).not.toHaveBeenCalledWith(
      ServiceWorkerCommand.setPopupKeepOpen,
      expect.anything(),
    )

    resolveState(true)
    await waitFor(() => expect(button.disabled).toBe(false))
    expect(button.getAttribute("aria-pressed")).toBe("true")
  })

  it("OIT-05: sends a single update when double clicked", async () => {
    const send = mockIpc({
      [ServiceWorkerCommand.canOpenInTab]: true,
      [ServiceWorkerCommand.getPopupKeepOpen]: false,
      [ServiceWorkerCommand.setPopupKeepOpen]: true,
    })

    render(<PopupControls />)
    const button = await getKeepOpenButton()
    await waitFor(() => expect(button.disabled).toBe(false))

    fireEvent.click(button)
    fireEvent.click(button)

    const updates = send.mock.calls.filter(
      ([command]) => command === ServiceWorkerCommand.setPopupKeepOpen,
    )
    expect(updates).toHaveLength(1)
    await waitFor(() => expect(button.disabled).toBe(false))
  })

  it("OIT-06: keeps the state and becomes clickable again when the update fails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    vi.spyOn(Ipc, "send").mockImplementation(async (command) => {
      if (command === ServiceWorkerCommand.canOpenInTab) return true
      if (command === ServiceWorkerCommand.getPopupKeepOpen) return false
      throw new Error("No reply")
    })

    render(<PopupControls />)
    const button = await getKeepOpenButton()
    await waitFor(() => expect(button.disabled).toBe(false))

    fireEvent.click(button)

    await waitFor(() => expect(warn).toHaveBeenCalled())
    await waitFor(() => expect(button.disabled).toBe(false))
    expect(button.getAttribute("aria-pressed")).toBe("false")
  })

  it("OIT-07: hides the menu when the close button is clicked", async () => {
    mockIpc({
      [ServiceWorkerCommand.canOpenInTab]: true,
      [ServiceWorkerCommand.getPopupKeepOpen]: false,
    })

    render(<PopupControls />)
    await getKeepOpenButton()

    fireEvent.click(screen.getByTitle("Close"))

    expect(screen.queryByRole("button", { hidden: true })).toBeNull()
  })

  it("OIT-08: keeps sending onHidden after the menu is closed", async () => {
    const send = mockIpc({
      [ServiceWorkerCommand.canOpenInTab]: true,
      [ServiceWorkerCommand.getPopupKeepOpen]: false,
    })

    render(<PopupControls />)
    await getKeepOpenButton()
    fireEvent.click(screen.getByTitle("Close"))

    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true)
    document.dispatchEvent(new Event("visibilitychange"))

    await waitFor(() =>
      expect(send).toHaveBeenCalledWith(ServiceWorkerCommand.onHidden),
    )
    hidden.mockRestore()
  })
})
