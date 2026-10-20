import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { OnboardingLayout } from "../OnboardingLayout"
import { OnboardingStep, StepPhase } from "@/types/onboarding"
import type { OnboardingBackground } from "../onboardingVariantUi"

const renderLayout = (background: OnboardingBackground) =>
  render(
    <OnboardingLayout
      step={OnboardingStep.SEARCH}
      phase={StepPhase.EXPLAIN}
      background={background}
      onSkip={vi.fn()}
    >
      <div />
    </OnboardingLayout>,
  )

describe("OnboardingLayout", () => {
  it("renders the slate vignette for the vignette background", () => {
    renderLayout("vignette")

    expect(screen.getByTestId("onboarding-layout-vignette")).toBeTruthy()
    expect(screen.queryByTestId("onboarding-layout-glow")).toBeNull()
  })

  it("renders the welcome glow instead for the glow background", () => {
    renderLayout("glow")

    expect(screen.getByTestId("onboarding-layout-glow")).toBeTruthy()
    expect(screen.queryByTestId("onboarding-layout-vignette")).toBeNull()
  })
})
