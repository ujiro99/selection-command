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

  it("opens on the intro step for variant A", () => {
    const { result } = renderHook(() => useOnboardingState("A"))

    expect(result.current.step).toBe(OnboardingStep.INTRO)
    expect(result.current.phase).toBe(StepPhase.EXPLAIN)
  })

  it("skips the intro and opens on the welcome overlay for variant C", () => {
    const { result } = renderHook(() => useOnboardingState("C"))

    expect(result.current.step).toBe(OnboardingStep.SEARCH)
    expect(result.current.phase).toBe(StepPhase.WELCOME)
  })

  it("opens on the welcome overlay for variant D too", () => {
    const { result } = renderHook(() => useOnboardingState("D"))

    expect(result.current.step).toBe(OnboardingStep.SEARCH)
    expect(result.current.phase).toBe(StepPhase.WELCOME)
  })

  it("keeps the rail and the vignette for variant C", () => {
    const { result } = renderHook(() => useOnboardingState("C"))

    expect(result.current.ui).toMatchObject({
      showRail: true,
      background: "vignette",
    })
  })

  it("drops the rail and uses the glow background for variant D", () => {
    const { result } = renderHook(() => useOnboardingState("D"))

    expect(result.current.ui).toMatchObject({
      showRail: false,
      background: "glow",
    })
  })
})
