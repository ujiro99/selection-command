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
    // Observe the DOM instead of polling, so the callout both appears once
    // the popup menu renders AND disappears if the button is later removed.
    const selector = `[data-command-id="${ONBOARDING_AI_PROMPT_COMMAND_ID}"]`
    const sync = () => {
      const elm = document.querySelector(selector)
      setCalloutElm(elm)
    }
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
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
      <OnboardingRail
        selectLabel={t("onboarding_railSelect")}
        commandLabel={t("onboarding_railCommand")}
        resultLabel={t("onboarding_railResultAi")}
        activeBeat={phase === StepPhase.WAIT_EXECUTE ? 1 : 0}
      />

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
        selected={phase !== StepPhase.EXPLAIN}
      />

      <OnboardingCallout targetElm={calloutElm} open={calloutElm != null}>
        {t("onboarding_step2Callout")}
      </OnboardingCallout>
    </div>
  )
}
