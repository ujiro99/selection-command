import { describe, it, expect, vi, beforeEach } from "vitest"
import { OnboardingStep } from "@/types/onboarding"
import { SCREEN } from "@/const"
import {
  overrideOnboardingAssignment,
  resetOnboardingAssignmentCache,
} from "@/services/experiments"

const sendEvent = vi.fn()
vi.mock("@/services/analytics", async () => {
  const actual = await vi.importActual("@/services/analytics")
  return {
    ...actual,
    sendEvent: (...args: unknown[]) => sendEvent(...args),
  }
})

const { sendOnboardingEvent, UNKNOWN_VARIANT } =
  await import("./onboardingAnalytics")
const { ANALYTICS_EVENTS } = await import("@/services/analytics")

describe("sendOnboardingEvent", () => {
  beforeEach(() => {
    sendEvent.mockClear()
    resetOnboardingAssignmentCache()
  })

  it("normalizes a numeric OnboardingStep param to its stable string label", () => {
    sendOnboardingEvent(ANALYTICS_EVENTS.ONBOARDING_VALUE_REACHED, {
      step: OnboardingStep.AI_PROMPT,
    })

    expect(sendEvent).toHaveBeenCalledWith(
      ANALYTICS_EVENTS.ONBOARDING_VALUE_REACHED,
      { step: "ai_prompt", variant: UNKNOWN_VARIANT },
      SCREEN.ONBOARDING,
    )
  })

  it("leaves params without a step field untouched", () => {
    sendOnboardingEvent(ANALYTICS_EVENTS.ONBOARDING_START, {
      locale: "en",
    })

    expect(sendEvent).toHaveBeenCalledWith(
      ANALYTICS_EVENTS.ONBOARDING_START,
      { locale: "en", variant: UNKNOWN_VARIANT },
      SCREEN.ONBOARDING,
    )
  })

  it("tags the event with the assigned A/B variant", () => {
    overrideOnboardingAssignment("B")

    sendOnboardingEvent(ANALYTICS_EVENTS.ONBOARDING_SKIP, {
      step: OnboardingStep.SEARCH,
    })

    expect(sendEvent).toHaveBeenCalledWith(
      ANALYTICS_EVENTS.ONBOARDING_SKIP,
      { step: "search", variant: "B" },
      SCREEN.ONBOARDING,
    )
  })

  it("falls back to the unknown variant when no assignment is resolved yet", () => {
    sendOnboardingEvent(ANALYTICS_EVENTS.ONBOARDING_COMPLETE, {
      completion_time_sec: 12.3,
    })

    expect(sendEvent).toHaveBeenCalledWith(
      ANALYTICS_EVENTS.ONBOARDING_COMPLETE,
      { completion_time_sec: 12.3, variant: "unknown" },
      SCREEN.ONBOARDING,
    )
  })
})
