import { useEffect, useState } from "react"
import { ChevronRight, PartyPopper } from "lucide-react"
import { t } from "@/services/i18n"
import { cn } from "@/lib/utils"
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
  const [returnCalloutElm, setReturnCalloutElm] = useState<Element | null>(null)

  const googleCommand = commands?.find((c) => c.title === "Google")

  // EXPLAIN -> WAIT_EXECUTE: once the user selects the sample text, the real
  // popup menu opens on its own (default startup method is text selection).
  useEffect(() => {
    if (phase !== StepPhase.EXPLAIN) return
    if (isEmpty(selectionText)) return
    onboarding.recordFirstSelection(OnboardingStep.SEARCH)
    setPhase(StepPhase.WAIT_EXECUTE, 600)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, selectionText])

  // Find the rendered Google command button (see MenuItem.tsx's
  // `data-command-id`) to point the callout at, once the menu has had a
  // chance to render. Re-runs on every selection change so that redoing the
  // text selection (which closes and reopens the real popup menu) hides the
  // stale callout and re-anchors it to the freshly rendered button instead
  // of staying frozen at the old position.
  useEffect(() => {
    if (phase !== StepPhase.WAIT_EXECUTE || !googleCommand) {
      setCalloutElm(null)
      return
    }
    if (isEmpty(selectionText)) {
      // Selection was cleared - the popup menu is gone, hide the callout
      // until a new selection reopens it.
      setCalloutElm(null)
      return
    }

    // Observe the DOM instead of polling, so the callout both appears once
    // the popup menu renders AND disappears if the button is later removed
    // (e.g. the popup menu closes without a selection change in between).
    const selector = `[data-command-id="${googleCommand.id}"]`
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
  }, [phase, googleCommand, selectionText])

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

  // WAIT_RETURN -> VALUE_SHOWN: the search command opens in a separate
  // browser window (see Popup.execute -> BgCommand.openPopup ->
  // chrome.windows.create), not a tab in this same window. Switching focus
  // between two on-screen windows doesn't reliably fire `visibilitychange`
  // (that API tracks tab occlusion/minimization, not window focus), so a
  // `focus` listener on this window is needed to reliably detect the user
  // clicking back onto the onboarding window.
  useEffect(() => {
    if (phase !== StepPhase.WAIT_RETURN) return

    const elm = document.querySelector(
      "[data-testid='onboarding-step1-callout-anchor']",
    )
    setReturnCalloutElm(elm)

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        setPhase(StepPhase.VALUE_SHOWN)
        setReturnCalloutElm(null)
      }
    }
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("focus", onVisible)
    return () => {
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("focus", onVisible)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const valueShown = phase === StepPhase.VALUE_SHOWN

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-10",
        !valueShown && phase !== StepPhase.WAIT_RETURN && "select-none",
        phase === StepPhase.WAIT_RETURN && "pb-40",
      )}
    >
      <OnboardingFadeIn key={"command-type"} delay={100}>
        {valueShown ? (
          <h2 className="text-4xl font-bold text-slate-700 flex items-center gap-2">
            <span
              className="-ml-5 flex size-14 animate-onboarding-pop items-center justify-center rounded-full bg-sky-950/[0.14] text-sky-950 brightness-[2.4] motion-reduce:animate-none motion-reduce:opacity-100"
              style={{ animationDelay: `300ms` }}
            >
              <PartyPopper className="size-[26px]" strokeWidth={2.6} />
            </span>
            {t("Option_commandType_search_title")}
          </h2>
        ) : (
          <h2 className="text-4xl font-bold text-slate-700 h-14 flex items-center">
            <span className="font-mono">1.</span>{" "}
            {t("Option_commandType_search_title")}
          </h2>
        )}
      </OnboardingFadeIn>

      <div className="flex flex-col items-center gap-4">
        <OnboardingFadeIn
          key={
            valueShown
              ? "value-message"
              : phase === StepPhase.WAIT_RETURN
                ? "return-hint"
                : "explain"
          }
          className="flex flex-col items-center gap-4"
          delay={300}
        >
          <p className="max-w-xl text-xl leading-[1.75] font-semibold text-slate-900">
            {valueShown
              ? t("onboarding_step1ValueMessage")
              : phase === StepPhase.WAIT_RETURN
                ? t("onboarding_step1ReturnHint")
                : t("onboarding_step1Explain")}
          </p>
        </OnboardingFadeIn>

        <OnboardingFadeIn
          key="rail"
          delay={400}
          className={valueShown ? undefined : "pb-14"}
        >
          <OnboardingRail
            selectLabel={t("onboarding_railSelect")}
            commandLabel={t("onboarding_railCommand")}
            resultLabel={t("onboarding_railResultSearch")}
            activeBeat={valueShown ? -1 : railBeat(phase)}
            size="lg"
          />
        </OnboardingFadeIn>
      </div>

      {valueShown ? (
        <OnboardingFadeIn key="next-button" delay={800}>
          <button
            type="button"
            onClick={() => onboarding.goToStep(OnboardingStep.AI_PROMPT)}
            className="flex items-center gap-2 min-h-14 rounded-xl bg-sky-950 px-8 text-lg font-semibold text-white shadow-[0_10px_20px_-14px_rgba(15,23,42,.7)] hover:brightness-[1.35]"
          >
            {t("onboarding_nextButton")}
            <ChevronRight className="inline-block size-5" />
          </button>
        </OnboardingFadeIn>
      ) : (
        <>
          {phase === StepPhase.WAIT_RETURN && (
            <span
              className="size-8 shrink-0 rounded-full bg-sky-950/[0.14] text-sky-950 animate-onboarding-blink motion-reduce:animate-none"
              data-testid="onboarding-step1-callout-anchor"
            ></span>
          )}

          <OnboardingFadeIn key={"target-text"} delay={500}>
            {phase !== StepPhase.WAIT_RETURN && (
              <OnboardingTargetText
                text={t("onboarding_step1TargetText")}
                selected={phase !== StepPhase.EXPLAIN}
              />
            )}
          </OnboardingFadeIn>

          <OnboardingCallout
            targetElm={calloutElm}
            open={calloutElm != null}
            openDelay={200}
            contentClassName="duration-300"
          >
            {t("onboarding_step1Callout")}
          </OnboardingCallout>

          <OnboardingCallout
            targetElm={returnCalloutElm}
            open={returnCalloutElm != null}
            openDelay={200}
            contentClassName="duration-300"
          >
            {t("onboarding_step1Callout_2")}
          </OnboardingCallout>
        </>
      )}
    </div>
  )
}
