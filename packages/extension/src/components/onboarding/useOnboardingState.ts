import { useCallback, useEffect, useRef, useState } from "react"
import { OnboardingStep, StepPhase } from "@/types/onboarding"
import { ANALYTICS_EVENTS } from "@/services/analytics"
import { sendOnboardingEvent } from "./onboardingAnalytics"
import { Settings } from "@/services/settings/settings"
import { getCurrentLocale } from "@/services/i18n"
import { VERSION } from "@/const"

export type UseOnboardingState = ReturnType<typeof useOnboardingState>

export function useOnboardingState() {
  const [step, setStep] = useState<OnboardingStep>(OnboardingStep.INTRO)
  const [phase, setPhase] = useState<StepPhase>(StepPhase.EXPLAIN)
  const startedAtRef = useRef<number>(Date.now())
  const firstValueSentRef = useRef(false)
  const seenSelectionStepsRef = useRef<Set<OnboardingStep>>(new Set())
  const finishedRef = useRef(false)

  useEffect(() => {
    sendOnboardingEvent(ANALYTICS_EVENTS.ONBOARDING_START, {
      locale: getCurrentLocale(),
      extension_version: VERSION,
    })
  }, [])

  const goToStep = useCallback((next: OnboardingStep) => {
    setStep(next)
    setPhase(StepPhase.EXPLAIN)
  }, [])

  // Records the first text/link selection observed within a given step.
  // No-ops on subsequent selections within the same step.
  const recordFirstSelection = useCallback((forStep: OnboardingStep) => {
    if (seenSelectionStepsRef.current.has(forStep)) return
    seenSelectionStepsRef.current.add(forStep)
    sendOnboardingEvent(ANALYTICS_EVENTS.ONBOARDING_FIRST_SELECTION, {
      step: forStep,
    })
  }, [])

  const recordCommandExecuted = useCallback(
    (forStep: OnboardingStep, commandType: string) => {
      sendOnboardingEvent(ANALYTICS_EVENTS.ONBOARDING_COMMAND_EXECUTE, {
        command_type: commandType,
        step: forStep,
      })
    },
    [],
  )

  // The first successful Search command execution (Step1) is treated as
  // "First Value" per the PRD, regardless of what happens in later steps.
  const recordFirstValue = useCallback(() => {
    if (firstValueSentRef.current) return
    firstValueSentRef.current = true
    sendOnboardingEvent(ANALYTICS_EVENTS.ONBOARDING_FIRST_VALUE)
  }, [])

  const markFinished = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    // Never show the onboarding tab again after this run, whether the user
    // completed it or skipped partway through.
    Settings.update("hasShownOnboarding", () => true)
  }, [])

  const skip = useCallback(() => {
    sendOnboardingEvent(ANALYTICS_EVENTS.ONBOARDING_SKIP, { step })
    markFinished()
  }, [step, markFinished])

  const complete = useCallback(() => {
    sendOnboardingEvent(ANALYTICS_EVENTS.ONBOARDING_COMPLETE, {
      completion_time: Date.now() - startedAtRef.current,
    })
    markFinished()
  }, [markFinished])

  return {
    step,
    phase,
    setPhase,
    goToStep,
    skip,
    complete,
    recordFirstSelection,
    recordCommandExecuted,
    recordFirstValue,
  }
}
