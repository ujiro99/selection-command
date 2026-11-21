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

  it("opens on the welcome overlay for variant F too", () => {
    const { result } = renderHook(() => useOnboardingState("F"))

    expect(result.current.step).toBe(OnboardingStep.SEARCH)
    expect(result.current.phase).toBe(StepPhase.WELCOME)
  })

  it("uses the vignette background for variant C", () => {
    const { result } = renderHook(() => useOnboardingState("C"))

    expect(result.current.ui.background).toBe("vignette")
  })

  it("uses the glow background for variant F", () => {
    const { result } = renderHook(() => useOnboardingState("F"))

    expect(result.current.ui.background).toBe("glow")
  })

  it("asks for a drag on Step 1 for variant C", () => {
    const { result } = renderHook(() => useOnboardingState("C"))

    expect(result.current.ui.searchSelectGesture).toBe("drag")
  })

  it("asks for a double-click on Step 1 for variant F", () => {
    const { result } = renderHook(() => useOnboardingState("F"))

    expect(result.current.ui.searchSelectGesture).toBe("doubleClick")
  })

  it("keeps variant C's welcome timing for variant F", () => {
    const c = renderHook(() => useOnboardingState("C")).result.current.ui
    const f = renderHook(() => useOnboardingState("F")).result.current.ui

    expect({ ...f.welcome, glowCenter: c.welcome.glowCenter }).toEqual(
      c.welcome,
    )
  })

  it("sends onboarding_welcome_done once, with how the welcome was dismissed", () => {
    const { result } = renderHook(() => useOnboardingState("C"))

    result.current.recordWelcomeDone("click")
    result.current.recordWelcomeDone("auto")

    const calls = sendOnboardingEvent.mock.calls.filter(
      ([name]) => name === "onboarding_welcome_done",
    )
    expect(calls).toEqual([["onboarding_welcome_done", { trigger: "click" }]])
  })

  it("sends onboarding_target_interact once per step", () => {
    const { result } = renderHook(() => useOnboardingState("F"))

    result.current.recordTargetInteract(OnboardingStep.SEARCH)
    result.current.recordTargetInteract(OnboardingStep.SEARCH)
    result.current.recordTargetInteract(OnboardingStep.AI_PROMPT)

    const calls = sendOnboardingEvent.mock.calls.filter(
      ([name]) => name === "onboarding_target_interact",
    )
    expect(calls).toEqual([
      ["onboarding_target_interact", { step: OnboardingStep.SEARCH }],
      ["onboarding_target_interact", { step: OnboardingStep.AI_PROMPT }],
    ])
  })
})
