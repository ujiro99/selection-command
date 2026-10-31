import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { RemoveDialog } from "../RemoveDialog"

// The footer holds the cancel and remove buttons.
const getFooter = () =>
  screen.getByText("Option_labelCancel").closest("button")!.parentElement!

describe("RemoveDialog footer", () => {
  it("RD-01: switches the footer layout at the sm breakpoint by default", () => {
    render(
      <RemoveDialog open onOpenChange={() => {}} onRemove={() => {}}>
        <span>item</span>
      </RemoveDialog>,
    )

    expect(getFooter()).toHaveClass("flex-col-reverse", "sm:flex-row")
  })

  it("RD-02: replaces the footer layout with footerClassName", () => {
    render(
      <RemoveDialog
        open
        onOpenChange={() => {}}
        onRemove={() => {}}
        footerClassName="flex-row justify-end space-x-2"
      >
        <span>item</span>
      </RemoveDialog>,
    )

    const footer = getFooter()
    expect(footer).toHaveClass("flex-row", "justify-end", "space-x-2")
    expect(footer).not.toHaveClass("flex-col-reverse")
  })
})
