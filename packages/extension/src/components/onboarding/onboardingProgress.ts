import { OnboardingStep } from "@/types/onboarding"

// The 4 steps the progress indicator tracks. INTRO and COMPLETE are
// bookends (no indicator shown for them) - see getProgress() below.
export const PROGRESS_STEPS = [
  OnboardingStep.SEARCH,
  OnboardingStep.AI_PROMPT,
  OnboardingStep.LINK_PREVIEW,
  OnboardingStep.CUSTOMIZE,
] as const

export type PillState = "done" | "current" | "todo"

export type OnboardingProgress = {
  pills: PillState[]
  current: number
  total: number
}

// Derives the header progress indicator's state from the current step, so
// no other component needs to know the step count or index arithmetic.
// Returns null for INTRO/COMPLETE, which don't show an indicator.
export function getProgress(step: OnboardingStep): OnboardingProgress | null {
  const index = PROGRESS_STEPS.indexOf(step as (typeof PROGRESS_STEPS)[number])
  if (index === -1) return null

  return {
    pills: PROGRESS_STEPS.map((_, i) =>
      i < index ? "done" : i === index ? "current" : "todo",
    ),
    current: index + 1,
    total: PROGRESS_STEPS.length,
  }
}

// The Skip button is available on every step except the final one - there's
// nothing left to skip once the user has reached it.
export const showsSkip = (step: OnboardingStep): boolean =>
  step !== OnboardingStep.COMPLETE
