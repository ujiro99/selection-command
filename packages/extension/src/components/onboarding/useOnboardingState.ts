import { useCallback, useEffect, useRef, useState } from "react"
import { OnboardingStep, StepPhase } from "@/types/onboarding"
import { ANALYTICS_EVENTS } from "@/services/analytics"
import { sendOnboardingEvent } from "./onboardingAnalytics"
import { Settings } from "@/services/settings/settings"
import { getCurrentLocale } from "@/services/i18n"
import { VERSION } from "@/const"
import { closeOnboardingTab } from "./onboardingWindow"

export type UseOnboardingState = ReturnType<typeof useOnboardingState>

// e2e-build-only escape hatch (`?step=SEARCH&phase=value_shown`) so
// screenshot/manual-QA tooling can land directly on any step/phase without
// driving the whole real flow. `import.meta.env.MODE` is only "e2e" for
// `vite build --mode e2e` (see package.json's build:e2e), so this is
// entirely inert in production and dev builds.
function readE2eOverride(): { step: OnboardingStep; phase: StepPhase } | null {
  if (import.meta.env.MODE !== "e2e") return null
  const params = new URLSearchParams(window.location.search)
  const stepParam = params.get("step")
  if (!stepParam) return null

  const step = OnboardingStep[stepParam as keyof typeof OnboardingStep]
  if (step === undefined) return null

  const phaseParam = params.get("phase")
  const phaseValues: string[] = Object.values(StepPhase)
  const phase =
    phaseParam && phaseValues.includes(phaseParam)
      ? (phaseParam as StepPhase)
      : StepPhase.EXPLAIN

  return { step, phase }
}

export function useOnboardingState() {
  const [step, setStep] = useState<OnboardingStep>(
    () => readE2eOverride()?.step ?? OnboardingStep.INTRO,
  )
  const [phase, setPhase] = useState<StepPhase>(
    () => readE2eOverride()?.phase ?? StepPhase.EXPLAIN,
  )
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

  const markFinished = useCallback(async () => {
    if (finishedRef.current) return
    finishedRef.current = true
    // Never show the onboarding tab again after this run, whether the user
    // completed it or skipped partway through. Awaited by callers so the
    // setting is persisted before the tab closes.
    await Settings.update("hasShownOnboarding", () => true)
  }, [])

  // Unlike Complete's "Close" button (a deliberate final step the user
  // reaches after reading the summary), Skip fires immediately on click, so
  // there's no natural delay for the settings write to land - explicitly
  // await it before closing the tab.
  const skip = useCallback(async () => {
    sendOnboardingEvent(ANALYTICS_EVENTS.ONBOARDING_SKIP, { step })
    await markFinished()
    await closeOnboardingTab()
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
