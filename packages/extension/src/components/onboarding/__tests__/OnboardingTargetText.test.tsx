import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

let selectionText = ""
vi.mock("@/hooks/useSelectContext", () => ({
  useSelectContext: () => ({ selectionText }),
}))
vi.mock("@/hooks/usePrefersReducedMotion", () => ({
  usePrefersReducedMotion: () => false,
}))
// The callout is positioned with a portal/popover; render its content inline
// so the hint text can be asserted directly.
vi.mock("../OnboardingCallout", () => ({
  OnboardingCallout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="callout">{children}</div>
  ),
}))

const { OnboardingTargetText } = await import("../OnboardingTargetText")

const TEXT =
  "An extension that lets you search selected text in a single click."

describe("OnboardingTargetText", () => {
  beforeEach(() => {
    selectionText = ""
  })

  it("OTT-01: asks for a drag by default", () => {
    render(
      <OnboardingTargetText
        text={TEXT}
        background="vignette"
        selected={false}
      />,
    )

    expect(screen.getByTestId("callout").textContent).toBe(
      "onboarding_selectHint",
    )
    expect(screen.queryByTestId("onboarding-target-word")).toBeNull()
  })

  it("OTT-02: demonstrates on the target word and asks for a double-click", () => {
    render(
      <OnboardingTargetText
        text={TEXT}
        background="vignette"
        selected={false}
        gesture="doubleClick"
        targetWord="extension"
      />,
    )

    expect(screen.getByTestId("callout").textContent).toBe(
      "onboarding_doubleClickHint",
    )
    expect(screen.getByTestId("onboarding-target-word").textContent).toBe(
      "extension",
    )
    // The whole sentence is still there, so a drag keeps working too.
    expect(screen.getByTestId("onboarding-target-card").textContent).toBe(TEXT)
  })

  it("OTT-03: falls back to the drag hint when the target word is not in the text", () => {
    render(
      <OnboardingTargetText
        text={TEXT}
        background="vignette"
        selected={false}
        gesture="doubleClick"
        targetWord="browser"
      />,
    )

    expect(screen.getByTestId("callout").textContent).toBe(
      "onboarding_selectHint",
    )
    expect(screen.queryByTestId("onboarding-target-word")).toBeNull()
  })

  it("OTT-04: uses a white card on the glow background and a muted one otherwise", () => {
    const { rerender } = render(
      <OnboardingTargetText text={TEXT} selected={false} background="glow" />,
    )
    const card = screen.getByTestId("onboarding-target-card")
    expect(card.className).toContain("bg-white")

    rerender(
      <OnboardingTargetText
        text={TEXT}
        selected={false}
        background="vignette"
      />,
    )
    expect(card.className).toContain("bg-muted/80")
    expect(card.className).not.toContain("bg-white")
  })

  it("OTT-05: reports presses on the card", () => {
    const onInteract = vi.fn()
    render(
      <OnboardingTargetText
        text={TEXT}
        background="vignette"
        selected={false}
        onInteract={onInteract}
      />,
    )

    fireEvent.pointerDown(screen.getByTestId("onboarding-target-card"))

    expect(onInteract).toHaveBeenCalledTimes(1)
  })
})
