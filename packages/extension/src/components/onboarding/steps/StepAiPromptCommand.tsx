import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"
import { t } from "@/services/i18n"
import { useSelectContext } from "@/hooks/useSelectContext"
import { isEmpty } from "@/lib/utils"
import { renderMultiline } from "../textUtils"
import { ONBOARDING_AI_PROMPT_COMMAND_ID } from "../onboardingCommand"
import { subscribeCommandExecuted } from "../onboardingEvents"
import { OnboardingCallout } from "../OnboardingCallout"
import { OnboardingFadeIn } from "../OnboardingFadeIn"
import { OnboardingTargetText } from "../OnboardingTargetText"
import { OnboardingRail } from "../OnboardingRail"
import { OnboardingStep, StepPhase } from "@/types/onboarding"
import type { UseOnboardingState } from "../useOnboardingState"

type Props = {
  onboarding: UseOnboardingState
}

function railBeat(phase: StepPhase): 0 | 1 | 2 | -1 {
  if (phase === StepPhase.WAIT_EXECUTE) return 1
  if (phase === StepPhase.WAIT_RETURN) return 2
  if (phase === StepPhase.VALUE_SHOWN) return -1
  return 0
}

// Step2: run the onboarding's dedicated AiPrompt command (see
// onboardingCommand.ts), which opens the side panel - unlike Step1's search,
// the onboarding page never loses visibility here, so there's no separate
// "wait for the user to come back" phase, and the rail only ever needs
// beats 0 (selecting) and 1 (running the command).
export function StepAiPromptCommand({ onboarding }: Props) {
  const { phase, setPhase } = onboarding
  const { selectionText, setSelectionText } = useSelectContext()
  const [calloutElm, setCalloutElm] = useState<Element | null>(null)

  const isExplain = phase === StepPhase.EXPLAIN
  const isWaitExecute = phase === StepPhase.WAIT_EXECUTE
  const isWaitReturn = phase === StepPhase.WAIT_RETURN
  const isValueShown = phase === StepPhase.VALUE_SHOWN

  useEffect(() => {
    setSelectionText("")
  }, [setSelectionText])

  useEffect(() => {
    if (!isExplain) return
    if (isEmpty(selectionText)) return
    onboarding.recordFirstSelection(OnboardingStep.AI_PROMPT)
    setPhase(StepPhase.WAIT_EXECUTE)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, selectionText])

  useEffect(() => {
    if (!isWaitExecute) {
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
  }, [isWaitExecute])

  useEffect(() => {
    if (!isWaitExecute) return
    return subscribeCommandExecuted(({ commandId, commandType }) => {
      if (commandId !== ONBOARDING_AI_PROMPT_COMMAND_ID) return
      onboarding.recordCommandExecuted(OnboardingStep.AI_PROMPT, commandType)
      setPhase(StepPhase.WAIT_RETURN)
      setPhase(StepPhase.VALUE_SHOWN, 5000)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Renders through this single return for every phase, including
  // VALUE_SHOWN, instead of branching into a separate <OnboardingValueShown>
  // subtree there - see StepSearchCommand.tsx for why: that would mount a
  // second, independent OnboardingRail, losing the "select -> command ->
  // result" beat animation's continuity right as the payoff screen appears.
  return (
    <div className={cn("flex flex-col items-center gap-10 select-none")}>
      <OnboardingFadeIn key={"command-type"} delay={100}>
        <h2 className="text-4xl font-bold text-slate-700 flex items-center">
          <span className="font-mono">2.</span>{" "}
          {t("Option_commandType_aiPrompt_title")}
        </h2>
      </OnboardingFadeIn>

      <div className="flex flex-col items-center gap-4">
        <OnboardingFadeIn
          key={
            isValueShown
              ? "value-message"
              : isWaitReturn
                ? "wait-return"
                : "explain"
          }
          className="flex flex-col items-center gap-4"
          delay={300}
        >
          <p className="max-w-xl text-xl leading-[1.75] font-semibold text-slate-900">
            {isValueShown ? (
              <>
                <span>{t("onboarding_step2ValueMessage")}</span>
                <span
                  className="ml-1 inline-block animate-onboarding-pop-2 motion-reduce:animate-none"
                  style={{ animationDelay: "500ms" }}
                >
                  🎉
                </span>
              </>
            ) : isWaitReturn ? (
              t("onboarding_step2WaitReturn")
            ) : (
              t("onboarding_step2Explain")
            )}
          </p>
        </OnboardingFadeIn>

        {isValueShown && (
          <OnboardingFadeIn key="value-submessage" delay={700}>
            <p className="max-w-xl text-base text-slate-700 text-pretty">
              {renderMultiline(t("onboarding_step2ValueSubmessage"))}
            </p>
          </OnboardingFadeIn>
        )}

        <OnboardingFadeIn
          key="rail"
          delay={400}
          className={isValueShown ? undefined : "pb-14"}
        >
          <OnboardingRail
            selectLabel={t("onboarding_railSelect")}
            commandLabel={t("onboarding_railCommand")}
            resultLabel={t("onboarding_railResultAi")}
            activeBeat={railBeat(phase)}
            size="lg"
          />
        </OnboardingFadeIn>
      </div>

      {!isValueShown && (
        <>
          <OnboardingFadeIn key={"target-text"} delay={500}>
            <OnboardingTargetText
              text={t("onboarding_step2TargetText")}
              selected={!isExplain}
            />
          </OnboardingFadeIn>

          <OnboardingCallout
            targetElm={calloutElm}
            open={calloutElm != null}
            openDelay={200}
            contentClassName="duration-300"
          >
            {t("onboarding_step2Callout")}
          </OnboardingCallout>
        </>
      )}

      {isValueShown && (
        <OnboardingFadeIn key="next-button" delay={1000}>
          <button
            type="button"
            onClick={() => onboarding.goToStep(OnboardingStep.LINK_PREVIEW)}
            className="flex items-center gap-2 min-h-14 rounded-xl bg-sky-950 px-8 text-lg font-semibold text-white shadow-[0_10px_20px_-14px_rgba(15,23,42,.7)] hover:brightness-[1.35]"
          >
            {t("onboarding_nextButton")}
            <ChevronRight className="inline-block size-5" />
          </button>
        </OnboardingFadeIn>
      )}
    </div>
  )
}
