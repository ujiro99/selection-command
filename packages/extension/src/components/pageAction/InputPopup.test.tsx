import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { InputMenu } from "./InputPopup"

describe("InputMenu file attach menu", () => {
  it("IM-01: enables the file attach menu by default", () => {
    render(<InputMenu targetElm={null} />)

    const trigger = screen
      .getByText("PageAction_InputMenu_fileAttach")
      .closest("button")
    expect(trigger).not.toBeDisabled()
  })

  it("IM-02: disables the file attach menu when fileAttachDisabled is true", () => {
    render(<InputMenu targetElm={null} fileAttachDisabled />)

    const trigger = screen
      .getByText("PageAction_InputMenu_fileAttach")
      .closest("button")
    expect(trigger).toBeDisabled()
  })

  it("IM-03: does not disable the insert-text menu when fileAttachDisabled is true", () => {
    render(<InputMenu targetElm={null} fileAttachDisabled />)

    const trigger = screen
      .getByText("PageAction_InputMenu_insertText")
      .closest("button")
    expect(trigger).not.toBeDisabled()
  })

  it("IM-04: opens the file attach submenu content on hover when enabled", () => {
    render(<InputMenu targetElm={null} />)

    const trigger = screen
      .getByText("PageAction_InputMenu_fileAttach")
      .closest("button")!
    fireEvent.mouseEnter(trigger)

    expect(
      screen.getByText("PageAction_InputMenu_pageHtml"),
    ).toBeInTheDocument()
  })

  it("IM-05: does not open the file attach submenu content on hover when disabled", () => {
    render(<InputMenu targetElm={null} fileAttachDisabled />)

    const trigger = screen
      .getByText("PageAction_InputMenu_fileAttach")
      .closest("button")!
    fireEvent.mouseEnter(trigger)

    expect(
      screen.queryByText("PageAction_InputMenu_pageHtml"),
    ).not.toBeInTheDocument()
  })

  it("IM-06: does not switch to the disabled file attach menu via Radix's pointer-enter auto-switch while another menu is already open", () => {
    render(<InputMenu targetElm={null} fileAttachDisabled />)

    const insertTrigger = screen
      .getByText("PageAction_InputMenu_insertText")
      .closest("button")!
    const fileAttachTrigger = screen
      .getByText("PageAction_InputMenu_fileAttach")
      .closest("button")!

    // Open the insert-text menu first, as if the user hovered it.
    fireEvent.mouseEnter(insertTrigger)
    expect(
      screen.getByText("PageAction_InputMenu_selectedText"),
    ).toBeInTheDocument()

    // Radix's MenubarTrigger auto-switches the open menu on `pointerenter`
    // (not `mouseenter`) whenever another menu is already open, regardless
    // of the `disabled` prop. Firing it directly reproduces that path.
    fireEvent.pointerEnter(fileAttachTrigger)

    expect(
      screen.queryByText("PageAction_InputMenu_pageHtml"),
    ).not.toBeInTheDocument()
    expect(
      screen.getByText("PageAction_InputMenu_selectedText"),
    ).toBeInTheDocument()
  })
})
