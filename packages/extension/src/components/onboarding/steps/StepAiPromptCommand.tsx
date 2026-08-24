import { useEffect, useRef, useState } from "react"
import { t } from "@/services/i18n"
import { useSelectContext } from "@/hooks/useSelectContext"
import { isEmpty } from "@/lib/utils"
import { ONBOARDING_AI_PROMPT_COMMAND_ID } from "../onboardingCommand"
import { subscribeCommandExecuted } from "../onboardingEvents"
import { OnboardingOverlay } from "../OnboardingOverlay"
import { OnboardingCallout } from "../OnboardingCallout"
import { OnboardingFadeIn } from "../OnboardingFadeIn"
import { OnboardingStep, StepPhase } from "@/types/onboarding"
import type { UseOnboardingState } from "../useOnboardingState"

type Props = {
  onboarding: UseOnboardingState
}

// Step2: run the onboarding's dedicated AiPrompt command (see
// onboardingCommand.ts), which opens the side panel - unlike Step1's search,
// the onboarding page never loses visibility here, so there's no separate
// "wait for the user to come back" phase.
export function StepAiPromptCommand({ onboarding }: Props) {
  const { phase, setPhase } = onboarding
  const { selectionText } = useSelectContext()
  const targetTextRef = useRef<HTMLSpanElement>(null)
  const [calloutElm, setCalloutElm] = useState<Element | null>(null)

  useEffect(() => {
    if (phase !== StepPhase.EXPLAIN) return
    if (isEmpty(selectionText)) return
    onboarding.recordFirstSelection(OnboardingStep.AI_PROMPT)
    setPhase(StepPhase.WAIT_EXECUTE)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, selectionText])

  useEffect(() => {
    if (phase !== StepPhase.WAIT_EXECUTE) {
      setCalloutElm(null)
      return
    }
    let cancelled = false
    const find = () => {
      if (cancelled) return
      const elm = document.querySelector(
        `[data-command-id="${ONBOARDING_AI_PROMPT_COMMAND_ID}"]`,
      )
      if (elm) {
        setCalloutElm(elm)
      } else {
        window.setTimeout(find, 150)
      }
    }
    find()
    return () => {
      cancelled = true
    }
  }, [phase])

  useEffect(() => {
    if (phase !== StepPhase.WAIT_EXECUTE) return
    return subscribeCommandExecuted(({ commandId, commandType }) => {
      if (commandId !== ONBOARDING_AI_PROMPT_COMMAND_ID) return
      onboarding.recordCommandExecuted(OnboardingStep.AI_PROMPT, commandType)
      setPhase(StepPhase.VALUE_SHOWN)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  return (
    <div className="flex flex-col items-center gap-6 py-16 text-center">
      <OnboardingFadeIn key={phase}>
        {phase === StepPhase.VALUE_SHOWN ? (
          <div className="flex flex-col items-center gap-4">
            <p className="max-w-md text-base text-gray-600">
              {t("onboarding_step2ValueMessage")}
            </p>
            <p className="text-xs font-medium tracking-wide text-gray-400 uppercase">
              {t("onboarding_step2Pattern")}
            </p>
            <button
              type="button"
              className="rounded-md bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
              onClick={() => onboarding.goToStep(OnboardingStep.LINK_PREVIEW)}
            >
              {t("onboarding_nextButton")}
            </button>
          </div>
        ) : (
          <p className="max-w-md text-base text-gray-600">
            {t("onboarding_step2Explain")}
          </p>
        )}
      </OnboardingFadeIn>

      {phase !== StepPhase.VALUE_SHOWN && (
        <span
          ref={targetTextRef}
          className="rounded-md bg-gray-100 px-4 py-3 text-base"
        >
          {t("onboarding_step2TargetText")}
        </span>
      )}

      {phase === StepPhase.EXPLAIN && (
        <OnboardingOverlay targetRef={targetTextRef} />
      )}

      <OnboardingCallout targetElm={calloutElm} open={calloutElm != null}>
        {t("onboarding_step2Callout")}
      </OnboardingCallout>

      <button
        type="button"
        className="text-sm text-gray-400 hover:text-gray-600"
        onClick={onboarding.skip}
      >
        {t("onboarding_skipButton")}
      </button>
    </div>
  )
}
