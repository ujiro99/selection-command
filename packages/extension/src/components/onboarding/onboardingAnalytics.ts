import { sendEvent, ANALYTICS_EVENTS } from "@/services/analytics"
import { SCREEN } from "@/const"
import { OnboardingStep } from "@/types/onboarding"
import { getOnboardingVariantSync } from "@/services/experiments"

// Stable string labels for GA4's `step` param, so recorded events keep their
// meaning even if OnboardingStep's numeric enum values ever change.
const STEP_LABELS: Record<OnboardingStep, string> = {
  [OnboardingStep.INTRO]: "intro",
  [OnboardingStep.SEARCH]: "search",
  [OnboardingStep.AI_PROMPT]: "ai_prompt",
  [OnboardingStep.LINK_PREVIEW]: "link_preview",
  [OnboardingStep.CUSTOMIZE]: "customize",
  [OnboardingStep.COMPLETE]: "complete",
}

// Reported as the `variant` param when an event somehow fires before the
// A/B assignment has been resolved - those events stay in the funnel but
// can be excluded from the comparison.
export const UNKNOWN_VARIANT = "unknown"

// Thin wrapper so step components never call sendEvent directly - keeps the
// SCREEN.ONBOARDING tag and event names centralized in one place. Also
// normalizes a `step` param (passed as the OnboardingStep enum) to its
// stable string label, and tags every onboarding_* event with the A/B
// variant so the whole funnel can be compared arm by arm.
export function sendOnboardingEvent(
  name: (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any = {},
) {
  const normalizedParams =
    params.step !== undefined
      ? { ...params, step: STEP_LABELS[params.step as OnboardingStep] }
      : params
  sendEvent(
    name,
    {
      ...normalizedParams,
      variant: getOnboardingVariantSync() ?? UNKNOWN_VARIANT,
    },
    SCREEN.ONBOARDING,
  )
}
