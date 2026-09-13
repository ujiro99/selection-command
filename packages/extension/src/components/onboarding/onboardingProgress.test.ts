import { describe, it, expect } from "vitest"
import { getProgress, showsSkip } from "./onboardingProgress"
import { OnboardingStep, StepPhase } from "@/types/onboarding"

describe("getProgress", () => {
  it("returns null for the intro bookend", () => {
    expect(getProgress(OnboardingStep.INTRO, StepPhase.EXPLAIN)).toBeNull()
  })

  it("returns null for the complete bookend", () => {
    expect(getProgress(OnboardingStep.COMPLETE, StepPhase.EXPLAIN)).toBeNull()
  })

  it("marks the first tracked step as current with the rest todo", () => {
    expect(getProgress(OnboardingStep.SEARCH, StepPhase.EXPLAIN)).toEqual({
      pills: ["current", "todo", "todo", "todo"],
      current: 1,
      total: 4,
    })
  })

  it("marks earlier steps done and later steps todo", () => {
    expect(getProgress(OnboardingStep.LINK_PREVIEW, StepPhase.EXPLAIN)).toEqual(
      {
        pills: ["done", "done", "current", "todo"],
        current: 3,
        total: 4,
      },
    )
  })

  it("returns null while variant B's welcome overlay is up", () => {
    expect(getProgress(OnboardingStep.SEARCH, StepPhase.WELCOME)).toBeNull()
  })

  it("marks the last tracked step as current with none todo", () => {
    expect(getProgress(OnboardingStep.CUSTOMIZE, StepPhase.EXPLAIN)).toEqual({
      pills: ["done", "done", "done", "current"],
      current: 4,
      total: 4,
    })
  })
})

describe("showsSkip", () => {
  it("is false while variant B's welcome overlay is up", () => {
    // The overlay hides the button visually - leaving it rendered would
    // only make it reachable by keyboard.
    expect(showsSkip(OnboardingStep.SEARCH, StepPhase.WELCOME)).toBe(false)
  })

  it("is true for every step except COMPLETE", () => {
    expect(showsSkip(OnboardingStep.INTRO, StepPhase.EXPLAIN)).toBe(true)
    expect(showsSkip(OnboardingStep.SEARCH, StepPhase.EXPLAIN)).toBe(true)
    expect(showsSkip(OnboardingStep.CUSTOMIZE, StepPhase.EXPLAIN)).toBe(true)
    expect(showsSkip(OnboardingStep.COMPLETE, StepPhase.EXPLAIN)).toBe(false)
  })
})
