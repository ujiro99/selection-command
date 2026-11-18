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

  it("opens on the welcome overlay for variant C", () => {
    const { result } = renderHook(() => useOnboardingState("C"))

    expect(result.current.step).toBe(OnboardingStep.SEARCH)
    expect(result.current.phase).toBe(StepPhase.WELCOME)
  })

  it("opens on the welcome overlay for variant E too", () => {
    const { result } = renderHook(() => useOnboardingState("E"))

    expect(result.current.step).toBe(OnboardingStep.SEARCH)
    expect(result.current.phase).toBe(StepPhase.WELCOME)
  })

  it("uses the vignette background for variant C", () => {
    const { result } = renderHook(() => useOnboardingState("C"))

    expect(result.current.ui.background).toBe("vignette")
  })

  it("uses the glow background for variant E", () => {
    const { result } = renderHook(() => useOnboardingState("E"))

    expect(result.current.ui.background).toBe("glow")
  })
})
