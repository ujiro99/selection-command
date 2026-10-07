import { act, render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { CommandUpdateConfirmDialog } from "../CommandUpdateConfirmDialog"
import { Ipc, TabCommand } from "@/services/ipc"

vi.mock("@/services/i18n", () => ({
  t: (key: string, params?: string[]) =>
    params?.length ? `${key}:${params.join(",")}` : key,
}))

type Listener = (
  param: { title: string },
  sender: chrome.runtime.MessageSender,
  response: (res?: unknown) => void,
) => boolean

function renderAndGetListener(): Listener {
  return renderDialog().listener
}

function renderDialog() {
  const addListener = vi.spyOn(Ipc, "addListener")
  const view = render(<CommandUpdateConfirmDialog />)
  const call = addListener.mock.calls.find(
    ([command]) => command === TabCommand.confirmCommandUpdate,
  )
  if (!call) throw new Error("listener not registered")
  return { listener: call[1] as Listener, ...view }
}

function openDialog(listener: Listener, title = "My Command") {
  const response = vi.fn()
  let ret: boolean | undefined
  act(() => {
    ret = listener({ title }, {} as chrome.runtime.MessageSender, response)
  })
  return { response, ret }
}

describe("CommandUpdateConfirmDialog", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("CUD-01: shows the dialog with the command title and responds async", () => {
    const listener = renderAndGetListener()
    const { ret } = openDialog(listener)

    expect(ret).toBe(true)
    expect(
      screen.getByText("commandUpdate_confirm_message:My Command"),
    ).toBeInTheDocument()
  })

  it("CUD-02: responds true when the user overwrites", () => {
    const listener = renderAndGetListener()
    const { response } = openDialog(listener)

    fireEvent.click(screen.getByText("commandUpdate_confirm_overwrite"))

    expect(response).toHaveBeenCalledWith(true)
    expect(response).toHaveBeenCalledTimes(1)
    expect(
      screen.queryByText("commandUpdate_confirm_title"),
    ).not.toBeInTheDocument()
  })

  it("CUD-03: responds false when the user cancels", () => {
    const listener = renderAndGetListener()
    const { response } = openDialog(listener)

    fireEvent.click(screen.getByText("commandUpdate_confirm_cancel"))

    expect(response).toHaveBeenCalledWith(false)
    expect(response).toHaveBeenCalledTimes(1)
  })

  it("CUD-04: responds false when the dialog is dismissed with Escape", () => {
    const listener = renderAndGetListener()
    const { response } = openDialog(listener)

    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: "Escape",
    })

    expect(response).toHaveBeenCalledWith(false)
  })

  it("CUD-06: responds false to a pending request on unmount", () => {
    const { listener, unmount } = renderDialog()
    const { response } = openDialog(listener)

    unmount()

    expect(response).toHaveBeenCalledWith(false)
    expect(response).toHaveBeenCalledTimes(1)
  })

  it("CUD-05: a newer request cancels the unanswered one", () => {
    const listener = renderAndGetListener()
    const first = openDialog(listener, "First")
    const second = openDialog(listener, "Second")

    expect(first.response).toHaveBeenCalledWith(false)
    expect(
      screen.getByText("commandUpdate_confirm_message:Second"),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByText("commandUpdate_confirm_overwrite"))
    expect(second.response).toHaveBeenCalledWith(true)
  })
})
