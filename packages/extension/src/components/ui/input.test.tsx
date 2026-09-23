import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { Input } from "./input"

describe("Input remaining count", () => {
  it("IN-01: hides the remaining count by default", () => {
    render(<Input value="abc" maxLength={10} readOnly />)

    expect(screen.queryByText("Remaining: 7")).toBeNull()
  })

  it("IN-02: shows the remaining count when enabled", () => {
    render(
      <Input
        value="abc"
        maxLength={10}
        showRemainingCount
        remainingCountLabel="Remaining"
        readOnly
      />,
    )

    expect(screen.getByText("Remaining: 7")).toBeInTheDocument()
  })

  it("IN-03: updates the remaining count for an uncontrolled input", async () => {
    const user = userEvent.setup()
    render(
      <Input
        aria-label="Name"
        maxLength={5}
        showRemainingCount
        remainingCountLabel="Remaining"
      />,
    )

    await user.type(screen.getByLabelText("Name"), "abc")

    expect(screen.getByText("Remaining: 2")).toBeInTheDocument()
  })
})
