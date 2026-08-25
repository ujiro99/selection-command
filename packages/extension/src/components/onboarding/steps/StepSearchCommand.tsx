import { useEffect, useState } from "react"
import { t } from "@/services/i18n"
import { useSelectContext } from "@/hooks/useSelectContext"
import { useSection } from "@/hooks/useSettings"
import { CACHE_SECTIONS } from "@/services/settings/settingsCache"
import { isEmpty } from "@/lib/utils"
import { OPEN_MODE_TYPE_MAP, COMMAND_TYPE } from "@/const"
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

// Maps this step's phase onto the select -> command -> result rail's
// 0/1/2 beat index (see OnboardingRail). WAIT_RETURN still counts as the
// "result" beat - the search already ran, we're just waiting for the user
// to switch back.
function railBeat(phase: StepPhase): 0 | 1 | 2 {
  if (phase === StepPhase.WAIT_EXECUTE) return 1
  if (phase === StepPhase.WAIT_RETURN) return 2
  return 0
}

// Step1: the user's first hands-on experience - select the sample text,
// see the real popup menu, run the (default) Google search command, and
// come back to see the value message. This is the PRD's "First Value".
export function StepSearchCommand({ onboarding }: Props) {
  const { phase, setPhase } = onboarding
  const { selectionText } = useSelectContext()
  const { data: commands } = useSection(CACHE_SECTIONS.COMMANDS)
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

  if (phase === StepPhase.VALUE_SHOWN) {
    return (
      <OnboardingValueShown
        message={t("onboarding_step1ValueMessage")}
        resultLabel={t("onboarding_railResultSearch")}
        onNext={() => onboarding.goToStep(OnboardingStep.AI_PROMPT)}
      />
    )
  }

  return (
    <div className="flex flex-col items-center gap-10 select-none">
      <OnboardingFadeIn
        key={phase}
        className="flex flex-col items-center gap-4"
      >
        {phase === StepPhase.WAIT_RETURN ? (
          <p className="inline-flex animate-onboarding-blink items-center rounded-md border border-slate-200 bg-white px-6 py-4 text-base leading-relaxed text-slate-700 shadow-[0_2px_4px_rgba(15,23,42,.04),0_22px_44px_-24px_rgba(15,23,42,.45)] motion-reduce:animate-none">
            {t("onboarding_step1ReturnHint")}
          </p>
        ) : (
          <p className="max-w-[540px] text-xl leading-[1.75] font-semibold text-slate-900">
            {t("onboarding_step1Explain")}
          </p>
        )}
      </OnboardingFadeIn>

      {phase !== StepPhase.WAIT_RETURN && (
        <OnboardingTargetText
          text={t("onboarding_step1TargetText")}
          demoActive={phase === StepPhase.EXPLAIN}
          selected={phase !== StepPhase.EXPLAIN}
        />
      )}

      <OnboardingCallout targetElm={calloutElm} open={calloutElm != null}>
        {t("onboarding_step1Callout")}
      </OnboardingCallout>

      <OnboardingRail
        selectLabel={t("onboarding_railSelect")}
        commandLabel={t("onboarding_railCommand")}
        resultLabel={t("onboarding_railResultSearch")}
        activeBeat={railBeat(phase)}
      />
    </div>
  )
}
