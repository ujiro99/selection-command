import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import userEvent from "@testing-library/user-event"
import { SearchUrlAssistButton } from "./SearchUrlAssistButton"

// Mock i18n
vi.mock("@/services/i18n", () => ({
  t: vi.fn((key) => {
    const translations: Record<string, string> = {
      Option_searchUrlAssist: "AI Assist",
    }
    return translations[key] || key
  }),
}))

describe("SearchUrlAssistButton", () => {
  it("SUB-01: renders button with AI Assist text", () => {
    const mockOnClick = vi.fn()
    render(<SearchUrlAssistButton onClick={mockOnClick} />)

    expect(screen.getByRole("button")).toBeInTheDocument()
    expect(screen.getByText("AI Assist")).toBeInTheDocument()
  })

  it("SUB-02: calls onClick handler when clicked", async () => {
    const user = userEvent.setup()
    const mockOnClick = vi.fn()
    render(<SearchUrlAssistButton onClick={mockOnClick} />)

    await user.click(screen.getByRole("button"))
    expect(mockOnClick).toHaveBeenCalledOnce()
  })

  it("SUB-03: can be disabled", () => {
    const mockOnClick = vi.fn()
    render(<SearchUrlAssistButton onClick={mockOnClick} disabled={true} />)

    expect(screen.getByRole("button")).toBeDisabled()
  })

  it("SUB-04: applies custom className", () => {
    const mockOnClick = vi.fn()
    render(
      <SearchUrlAssistButton onClick={mockOnClick} className="custom-class" />,
    )

    expect(screen.getByRole("button")).toHaveClass("custom-class")
  })

  it("SUB-05: displays Sparkles icon", () => {
    const mockOnClick = vi.fn()
    render(<SearchUrlAssistButton onClick={mockOnClick} />)

    // Check if the Sparkles icon is rendered (by checking for the button's child elements)
    const button = screen.getByRole("button")
    expect(button).toBeInTheDocument()

    // The Sparkles icon should be present as an SVG element
    const svgIcon = button.querySelector("svg")
    expect(svgIcon).toBeInTheDocument()
  })

  it("SUB-06: has proper styling classes", () => {
    const mockOnClick = vi.fn()
    render(<SearchUrlAssistButton onClick={mockOnClick} />)

    const button = screen.getByRole("button")

    // Check for expected styling classes
    expect(button).toHaveClass("bg-gradient-to-r")
    expect(button).toHaveClass("from-purple-50")
    expect(button).toHaveClass("to-blue-50")
    expect(button).toHaveClass("border-purple-200")
  })

  it("SUB-07: disabled state has proper opacity", () => {
    const mockOnClick = vi.fn()
    render(<SearchUrlAssistButton onClick={mockOnClick} disabled={true} />)

    const button = screen.getByRole("button")
    expect(button).toHaveClass("opacity-50")
    expect(button).toHaveClass("cursor-not-allowed")
  })
})
