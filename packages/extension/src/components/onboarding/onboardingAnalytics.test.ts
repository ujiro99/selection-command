import { describe, it, expect, vi } from "vitest"
import { OnboardingStep } from "@/types/onboarding"
import { SCREEN } from "@/const"

const sendEvent = vi.fn()
vi.mock("@/services/analytics", async () => {
  const actual = await vi.importActual("@/services/analytics")
  return {
    ...actual,
    sendEvent: (...args: unknown[]) => sendEvent(...args),
  }
})

const { sendOnboardingEvent } = await import("./onboardingAnalytics")
const { ANALYTICS_EVENTS } = await import("@/services/analytics")

describe("sendOnboardingEvent", () => {
  it("normalizes a numeric OnboardingStep param to its stable string label", () => {
    sendOnboardingEvent(ANALYTICS_EVENTS.ONBOARDING_VALUE_REACHED, {
      step: OnboardingStep.AI_PROMPT,
    })

    expect(sendEvent).toHaveBeenCalledWith(
      ANALYTICS_EVENTS.ONBOARDING_VALUE_REACHED,
      { step: "ai_prompt" },
      SCREEN.ONBOARDING,
    )
  })

  it("leaves params without a step field untouched", () => {
    sendOnboardingEvent(ANALYTICS_EVENTS.ONBOARDING_START, {
      locale: "en",
    })

    expect(sendEvent).toHaveBeenCalledWith(
      ANALYTICS_EVENTS.ONBOARDING_START,
      { locale: "en" },
      SCREEN.ONBOARDING,
    )
  })
})
