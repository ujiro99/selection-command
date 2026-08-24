import { useEffect, useRef, useState } from "react"
import { t } from "@/services/i18n"
import { useSelectContext } from "@/hooks/useSelectContext"
import { useSection } from "@/hooks/useSettings"
import { CACHE_SECTIONS } from "@/services/settings/settingsCache"
import { isEmpty } from "@/lib/utils"
import { OPEN_MODE_TYPE_MAP, COMMAND_TYPE } from "@/const"
import { subscribeCommandExecuted } from "../onboardingEvents"
import { OnboardingOverlay } from "../OnboardingOverlay"
import { OnboardingCallout } from "../OnboardingCallout"
import { OnboardingFadeIn } from "../OnboardingFadeIn"
import { OnboardingStep, StepPhase } from "@/types/onboarding"
import type { UseOnboardingState } from "../useOnboardingState"

type Props = {
  onboarding: UseOnboardingState
}

// Step1: the user's first hands-on experience - select the sample text,
// see the real popup menu, run the (default) Google search command, and
// come back to see the value message. This is the PRD's "First Value".
export function StepSearchCommand({ onboarding }: Props) {
  const { phase, setPhase } = onboarding
  const { selectionText } = useSelectContext()
  const { data: commands } = useSection(CACHE_SECTIONS.COMMANDS)
  const targetTextRef = useRef<HTMLSpanElement>(null)
  const [calloutElm, setCalloutElm] = useState<Element | null>(null)

  const googleCommand = commands?.find((c) => c.title === "Google")

  // EXPLAIN -> WAIT_EXECUTE: once the user selects the sample text, the real
  // popup menu opens on its own (default startup method is text selection).
  useEffect(() => {
    if (phase !== StepPhase.EXPLAIN) return
    if (isEmpty(selectionText)) return
    onboarding.recordFirstSelection(OnboardingStep.SEARCH)
    setPhase(StepPhase.WAIT_EXECUTE)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, selectionText])

  // Find the rendered Google command button (see MenuItem.tsx's
  // `data-command-id`) to point the callout at, once the menu has had a
  // chance to render.
  useEffect(() => {
    if (phase !== StepPhase.WAIT_EXECUTE || !googleCommand) {
      setCalloutElm(null)
      return
    }
    let cancelled = false
    const find = () => {
      if (cancelled) return
      const elm = document.querySelector(
        `[data-command-id="${googleCommand.id}"]`,
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
  }, [phase, googleCommand])

  // WAIT_EXECUTE -> WAIT_RETURN: any search-type command counts (the
  // callout points at Google specifically, but the default set has several
  // search commands - being lenient here matches the PRD's "選択→コマンド→
  // 検索" mental model rather than requiring one exact command).
  useEffect(() => {
    if (phase !== StepPhase.WAIT_EXECUTE) return
    return subscribeCommandExecuted(({ commandType }) => {
      onboarding.recordCommandExecuted(OnboardingStep.SEARCH, commandType)
      if (
        OPEN_MODE_TYPE_MAP[commandType as keyof typeof OPEN_MODE_TYPE_MAP] ===
        COMMAND_TYPE.SEARCH
      ) {
        onboarding.recordFirstValue()
        setPhase(StepPhase.WAIT_RETURN)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // WAIT_RETURN -> VALUE_SHOWN: the search command opens a separate
  // popup/tab, so "coming back" is detected via the onboarding tab
  // regaining visibility.
  useEffect(() => {
    if (phase !== StepPhase.WAIT_RETURN) return
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        setPhase(StepPhase.VALUE_SHOWN)
      }
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  return (
    <div className="flex flex-col items-center gap-6 py-16 text-center">
      <OnboardingFadeIn key={phase}>
        {phase === StepPhase.VALUE_SHOWN ? (
          <div className="flex flex-col items-center gap-4">
            <p className="max-w-md text-base text-gray-600">
              {t("onboarding_step1ValueMessage")}
            </p>
            <button
              type="button"
              className="rounded-md bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
              onClick={() => onboarding.goToStep(OnboardingStep.AI_PROMPT)}
            >
              {t("onboarding_nextButton")}
            </button>
          </div>
        ) : (
          <p className="max-w-md text-base text-gray-600">
            {t("onboarding_step1Explain")}
          </p>
        )}
      </OnboardingFadeIn>

      {phase !== StepPhase.VALUE_SHOWN && (
        <span
          ref={targetTextRef}
          className="rounded-md bg-gray-100 px-4 py-3 text-base"
        >
          {t("onboarding_step1TargetText")}
        </span>
      )}

      {phase === StepPhase.EXPLAIN && (
        <OnboardingOverlay targetRef={targetTextRef} />
      )}

      <OnboardingCallout targetElm={calloutElm} open={calloutElm != null}>
        {t("onboarding_step1Callout")}
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
