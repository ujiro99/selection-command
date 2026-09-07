import { sendEvent, ANALYTICS_EVENTS } from "@/services/analytics"
import { SCREEN } from "@/const"
import { OnboardingStep } from "@/types/onboarding"

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

// Thin wrapper so step components never call sendEvent directly - keeps the
// SCREEN.ONBOARDING tag and event names centralized in one place. Also
// normalizes a `step` param (passed as the OnboardingStep enum) to its
// stable string label before sending.
export function sendOnboardingEvent(
  name: (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any = {},
) {
  const normalizedParams =
    params.step !== undefined
      ? { ...params, step: STEP_LABELS[params.step as OnboardingStep] }
      : params
  sendEvent(name, normalizedParams, SCREEN.ONBOARDING)
}
