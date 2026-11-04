import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { RemoveDialog } from "../RemoveDialog"

// The footer holds the cancel and remove buttons.
const getFooter = () =>
  screen.getByText("Option_labelCancel").closest("button")!.parentElement!

describe("RemoveDialog class names", () => {
  it("RD-01: 正常系: 既定ではsmブレークポイントでフッターのレイアウトを切り替える", () => {
    render(
      <RemoveDialog open onOpenChange={() => {}} onRemove={() => {}}>
        <span>item</span>
      </RemoveDialog>,
    )

    expect(getFooter()).toHaveClass("flex-col-reverse", "sm:flex-row")
  })

  it("RD-02: 正常系: footerClassNameでフッターのレイアウトを置き換える", () => {
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

  it("RD-03: 正常系: classNameをダイアログ本体に付与する", () => {
    render(
      <RemoveDialog
        open
        onOpenChange={() => {}}
        onRemove={() => {}}
        className="custom-content"
      >
        <span>item</span>
      </RemoveDialog>,
    )

    expect(screen.getByRole("dialog")).toHaveClass("custom-content")
  })
})
