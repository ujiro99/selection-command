import { useEffect, useState } from "react"
import { t } from "@/services/i18n"
import { useSelectContext } from "@/hooks/useSelectContext"
import { isEmpty } from "@/lib/utils"
import { ONBOARDING_AI_PROMPT_COMMAND_ID } from "../onboardingCommand"
import { subscribeCommandExecuted } from "../onboardingEvents"
import { OnboardingCallout } from "../OnboardingCallout"
import { OnboardingFadeIn } from "../OnboardingFadeIn"
import { OnboardingTargetText } from "../OnboardingTargetText"
import { OnboardingRail } from "../OnboardingRail"
import { OnboardingValueShown } from "../OnboardingValueShown"
import { OnboardingStep, StepPhase } from "@/types/onboarding"
import type { UseOnboardingState } from "../useOnboardingState"

type Props = {
  onboarding: UseOnboardingState
}

// Step2: run the onboarding's dedicated AiPrompt command (see
// onboardingCommand.ts), which opens the side panel - unlike Step1's search,
// the onboarding page never loses visibility here, so there's no separate
// "wait for the user to come back" phase, and the rail only ever needs
// beats 0 (selecting) and 1 (running the command).
export function StepAiPromptCommand({ onboarding }: Props) {
  const { phase, setPhase } = onboarding
  const { selectionText } = useSelectContext()
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

  if (phase === StepPhase.VALUE_SHOWN) {
    return (
      <OnboardingValueShown
        message={t("onboarding_step2ValueMessage")}
        resultLabel={t("onboarding_railResultAi")}
        onNext={() => onboarding.goToStep(OnboardingStep.LINK_PREVIEW)}
      />
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <OnboardingFadeIn
        key={phase}
        className="flex flex-col items-center gap-4"
      >
        <p
          className={
            phase === StepPhase.EXPLAIN
              ? "max-w-[540px] text-xl leading-[1.75] font-semibold text-slate-900"
              : "max-w-[540px] text-xl leading-[1.75] font-semibold text-slate-500"
          }
        >
          {t("onboarding_step2Explain")}
        </p>
      </OnboardingFadeIn>

      <OnboardingTargetText
        text={t("onboarding_step2TargetText")}
        demoActive={phase === StepPhase.EXPLAIN}
        selected={phase !== StepPhase.EXPLAIN}
      />

      <OnboardingCallout targetElm={calloutElm} open={calloutElm != null}>
        {t("onboarding_step2Callout")}
      </OnboardingCallout>

      <OnboardingRail
        selectLabel={t("onboarding_railSelect")}
        commandLabel={t("onboarding_railCommand")}
        resultLabel={t("onboarding_railResultAi")}
        activeBeat={phase === StepPhase.WAIT_EXECUTE ? 1 : 0}
      />
    </div>
  )
}
