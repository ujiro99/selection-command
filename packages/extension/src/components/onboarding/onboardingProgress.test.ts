import { describe, it, expect } from "vitest"
import { getProgress, showsSkip } from "./onboardingProgress"
import { OnboardingStep } from "@/types/onboarding"

describe("getProgress", () => {
  it("returns null for the intro bookend", () => {
    expect(getProgress(OnboardingStep.INTRO)).toBeNull()
  })

  it("returns null for the complete bookend", () => {
    expect(getProgress(OnboardingStep.COMPLETE)).toBeNull()
  })

  it("marks the first tracked step as current with the rest todo", () => {
    expect(getProgress(OnboardingStep.SEARCH)).toEqual({
      pills: ["current", "todo", "todo", "todo"],
      current: 1,
      total: 4,
    })
  })

  it("marks earlier steps done and later steps todo", () => {
    expect(getProgress(OnboardingStep.LINK_PREVIEW)).toEqual({
      pills: ["done", "done", "current", "todo"],
      current: 3,
      total: 4,
    })
  })

  it("marks the last tracked step as current with none todo", () => {
    expect(getProgress(OnboardingStep.CUSTOMIZE)).toEqual({
      pills: ["done", "done", "done", "current"],
      current: 4,
      total: 4,
    })
  })
})

describe("showsSkip", () => {
  it("is true for every step except COMPLETE", () => {
    expect(showsSkip(OnboardingStep.INTRO)).toBe(true)
    expect(showsSkip(OnboardingStep.SEARCH)).toBe(true)
    expect(showsSkip(OnboardingStep.CUSTOMIZE)).toBe(true)
    expect(showsSkip(OnboardingStep.COMPLETE)).toBe(false)
  })
})
