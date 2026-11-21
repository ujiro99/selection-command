import { useCallback, useEffect, useRef, useState } from "react"
import { OnboardingStep, StepPhase } from "@/types/onboarding"
import { ANALYTICS_EVENTS } from "@/services/analytics"
import { sendOnboardingEvent } from "./onboardingAnalytics"
import { Settings } from "@/services/settings/settings"
import { getCurrentLocale } from "@/services/i18n"
import { VERSION } from "@/const"
import { closeOnboardingTab } from "./onboardingWindow"
import { getOnboardingAssignmentSync } from "@/services/experiments"
import type { ExperimentVariant } from "@/services/experiments"
import { getVariantUi } from "./onboardingVariantUi"

export type UseOnboardingState = ReturnType<typeof useOnboardingState>

// How the welcome overlay was dismissed: on its own timer, or by a click.
export type WelcomeDoneTrigger = "auto" | "click"

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

// Every variant opens on the first real step behind a short welcome overlay
// (see OnboardingWelcome).
const INITIAL_STEP_AND_PHASE = {
  step: OnboardingStep.SEARCH,
  phase: StepPhase.WELCOME,
}

export function useOnboardingState(variant: ExperimentVariant) {
  const [initial] = useState(
    () => readStepAndPhaseOverride() ?? INITIAL_STEP_AND_PHASE,
  )
  const ui = getVariantUi(variant)
  const [step, setStep] = useState<OnboardingStep>(initial.step)
  const [phase, _setPhase] = useState<StepPhase>(initial.phase)
  const startedAtRef = useRef<number>(Date.now())
  const seenValueStepsRef = useRef<Set<OnboardingStep>>(new Set())
  const seenSelectionStepsRef = useRef<Set<OnboardingStep>>(new Set())
  const seenInteractStepsRef = useRef<Set<OnboardingStep>>(new Set())
  const welcomeDoneRef = useRef(false)
  const finishedRef = useRef(false)
  const hasEventSendRef = useRef(false)
  const phaseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (phaseTimeoutRef.current != null) {
        clearTimeout(phaseTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (hasEventSendRef.current) return
    hasEventSendRef.current = true
    sendOnboardingEvent(ANALYTICS_EVENTS.ONBOARDING_START, {
      locale: getCurrentLocale(),
      extension_version: VERSION,
      // Lets a hub outage (which forces the build-time allocation) be
      // separated out when the results are analyzed.
      config_source: getOnboardingAssignmentSync()?.configSource ?? "unknown",
    })
  }, [])

  const setPhase = useCallback((next: StepPhase, delay?: number) => {
    if (phaseTimeoutRef.current != null) {
      clearTimeout(phaseTimeoutRef.current)
      phaseTimeoutRef.current = null
    }
    if (delay) {
      phaseTimeoutRef.current = setTimeout(() => {
        phaseTimeoutRef.current = null
        _setPhase(next)
      }, delay)
      return
    }
    _setPhase(next)
  }, [])

  const goToStep = useCallback((next: OnboardingStep) => {
    if (phaseTimeoutRef.current != null) {
      clearTimeout(phaseTimeoutRef.current)
      phaseTimeoutRef.current = null
    }
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

  // Records the welcome overlay handing off to the first step, i.e. the user
  // stayed long enough to actually see Step 1. `trigger` tells an
  // auto-advance apart from a click that skipped the rest of the greeting.
  const recordWelcomeDone = useCallback((trigger: WelcomeDoneTrigger) => {
    if (welcomeDoneRef.current) return
    welcomeDoneRef.current = true
    sendOnboardingEvent(ANALYTICS_EVENTS.ONBOARDING_WELCOME_DONE, { trigger })
  }, [])

  // Records the first press on a step's sample text card, whether or not it
  // goes on to produce a selection. No-ops on later presses in that step,
  // and once the step already has a selection (e.g. a drag that started
  // outside the card, or a press while the popup menu is open), so the event
  // only ever marks a press that came before the first selection.
  const recordTargetInteract = useCallback((forStep: OnboardingStep) => {
    if (seenSelectionStepsRef.current.has(forStep)) return
    if (seenInteractStepsRef.current.has(forStep)) return
    seenInteractStepsRef.current.add(forStep)
    sendOnboardingEvent(ANALYTICS_EVENTS.ONBOARDING_TARGET_INTERACT, {
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
      completion_time_sec:
        Math.round((Date.now() - startedAtRef.current) / 100) / 10,
    })
    markFinished()
  }, [markFinished])

  return {
    step,
    phase,
    ui,
    setPhase,
    goToStep,
    skip,
    complete,
    recordWelcomeDone,
    recordTargetInteract,
    recordFirstSelection,
    recordCommandExecuted,
  }
}
