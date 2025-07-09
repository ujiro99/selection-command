import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Button } from "./button"

describe("Button", () => {
  it("renders button with text", () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole("button")).toBeInTheDocument()
    expect(screen.getByText("Click me")).toBeInTheDocument()
  })

  it("can be disabled", () => {
    render(<Button disabled>Disabled button</Button>)
    expect(screen.getByRole("button")).toBeDisabled()
  })

  it("applies custom className", () => {
    render(<Button className="custom-class">Button</Button>)
    expect(screen.getByRole("button")).toHaveClass("custom-class")
  })
})
