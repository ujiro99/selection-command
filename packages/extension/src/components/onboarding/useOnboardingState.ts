import { useCallback, useEffect, useRef, useState } from "react"
import { OnboardingStep, StepPhase } from "@/types/onboarding"
import { ANALYTICS_EVENTS } from "@/services/analytics"
import { sendOnboardingEvent } from "./onboardingAnalytics"
import { Settings } from "@/services/settings/settings"
import { getCurrentLocale } from "@/services/i18n"
import { VERSION } from "@/const"
import { closeOnboardingTab } from "./onboardingWindow"

export type UseOnboardingState = ReturnType<typeof useOnboardingState>

// development or e2e build-only escape hatch (`?step=SEARCH&phase=value_shown`) so
// screenshot/manual-QA tooling can land directly on any step/phase without
// driving the whole real flow.
function readStepAndPhaseOverride(): {
  step: OnboardingStep
  phase: StepPhase
} | null {
  if (!["e2e", "development"].includes(import.meta.env.MODE)) return null
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
    () => readStepAndPhaseOverride()?.step ?? OnboardingStep.INTRO,
  )
  const [phase, _setPhase] = useState<StepPhase>(
    () => readStepAndPhaseOverride()?.phase ?? StepPhase.EXPLAIN,
  )
  const startedAtRef = useRef<number>(Date.now())
  const seenValueStepsRef = useRef<Set<OnboardingStep>>(new Set())
  const seenSelectionStepsRef = useRef<Set<OnboardingStep>>(new Set())
  const finishedRef = useRef(false)
  const hasEventSendRef = useRef(false)

  useEffect(() => {
    if (hasEventSendRef.current) return
    hasEventSendRef.current = true
    sendOnboardingEvent(ANALYTICS_EVENTS.ONBOARDING_START, {
      locale: getCurrentLocale(),
      extension_version: VERSION,
    })
  }, [])

  const setPhase = useCallback((next: StepPhase, delay?: number) => {
    if (delay) {
      setTimeout(() => _setPhase(next), delay)
      return
    }
    _setPhase(next)
  }, [])

  const goToStep = useCallback((next: OnboardingStep) => {
    setStep(next)
    _setPhase(StepPhase.EXPLAIN)
  }, [])

  // Fires once per step, the first time that step reaches VALUE_SHOWN -
  // that phase is each step's "the user got the payoff" moment per the PRD.
  useEffect(() => {
    if (phase !== StepPhase.VALUE_SHOWN) return
    if (seenValueStepsRef.current.has(step)) return
    seenValueStepsRef.current.add(step)
    sendOnboardingEvent(ANALYTICS_EVENTS.ONBOARDING_VALUE_REACHED, { step })
  }, [phase, step])

  // Records the first text/link selection observed within a given step.
  // No-ops on subsequent selections within the same step.
  const recordFirstSelection = useCallback((forStep: OnboardingStep) => {
    if (seenSelectionStepsRef.current.has(forStep)) return
    seenSelectionStepsRef.current.add(forStep)
    sendOnboardingEvent(ANALYTICS_EVENTS.ONBOARDING_TEXT_SELECTION, {
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
    // Guard here too, not just inside markFinished() - StepComplete calls
    // this from a mount-time useEffect, which StrictMode's dev-only double
    // effect invocation would otherwise run twice, sending this event twice.
    if (finishedRef.current) return
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
  }
}
