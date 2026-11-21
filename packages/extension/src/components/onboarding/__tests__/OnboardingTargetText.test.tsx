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
const { splitTargetWord } = await import("../textUtils")

const TEXT =
  "An extension that lets you search selected text in a single click."

describe("splitTargetWord", () => {
  it("splits the text around the first occurrence of the word", () => {
    expect(splitTargetWord(TEXT, "extension")).toEqual({
      before: "An ",
      word: "extension",
      after: " that lets you search selected text in a single click.",
    })
  })

  it("returns null when the word is missing or absent from the text", () => {
    expect(splitTargetWord(TEXT, undefined)).toBeNull()
    expect(splitTargetWord(TEXT, "")).toBeNull()
    expect(splitTargetWord(TEXT, "browser")).toBeNull()
  })
})

describe("OnboardingTargetText", () => {
  beforeEach(() => {
    selectionText = ""
  })

  it("asks for a drag by default", () => {
    render(<OnboardingTargetText text={TEXT} selected={false} />)

    expect(screen.getByTestId("callout").textContent).toBe(
      "onboarding_selectHint",
    )
    expect(screen.queryByTestId("onboarding-target-word")).toBeNull()
  })

  it("demonstrates on the target word and asks for a double-click", () => {
    render(
      <OnboardingTargetText
        text={TEXT}
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

  it("falls back to the drag hint when the target word is not in the text", () => {
    render(
      <OnboardingTargetText
        text={TEXT}
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

  it("uses a white card on the glow background and a muted one otherwise", () => {
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

  it("reports presses on the card", () => {
    const onInteract = vi.fn()
    render(
      <OnboardingTargetText
        text={TEXT}
        selected={false}
        onInteract={onInteract}
      />,
    )

    fireEvent.pointerDown(screen.getByTestId("onboarding-target-card"))

    expect(onInteract).toHaveBeenCalledTimes(1)
  })
})
