import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook } from "@testing-library/react"
import { OnboardingStep, StepPhase } from "@/types/onboarding"

const sendOnboardingEvent = vi.fn()
vi.mock("../onboardingAnalytics", () => ({
  sendOnboardingEvent: (...args: unknown[]) => sendOnboardingEvent(...args),
}))

const { useOnboardingState } = await import("../useOnboardingState")

describe("useOnboardingState", () => {
  beforeEach(() => {
    sendOnboardingEvent.mockClear()
  })

  it("opens on the intro step for the control variant", () => {
    const { result } = renderHook(() => useOnboardingState("A"))

    expect(result.current.step).toBe(OnboardingStep.INTRO)
    expect(result.current.phase).toBe(StepPhase.EXPLAIN)
  })

  it("skips the intro and opens on the welcome overlay for variant C", () => {
    const { result } = renderHook(() => useOnboardingState("C"))

    expect(result.current.step).toBe(OnboardingStep.SEARCH)
    expect(result.current.phase).toBe(StepPhase.WELCOME)
  })
})
