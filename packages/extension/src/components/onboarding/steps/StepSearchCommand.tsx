import { useEffect, useState } from "react"
import { ChevronRight } from "lucide-react"
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
import type { PhaseDelays } from "../phaseDelays"

type Props = {
  onboarding: UseOnboardingState
}

// WAIT_RETURN still counts as the rail's "result" beat (see
// OnboardingRail) - the search already ran, we're just waiting for the
// user to switch back.
function railBeat(phase: StepPhase): 0 | 1 | 2 {
  if (phase === StepPhase.WAIT_EXECUTE) return 1
  if (phase === StepPhase.WAIT_RETURN) return 2
  return 0
}

// Step1 - the PRD's "First Value" moment.
export function StepSearchCommand({ onboarding }: Props) {
  const { phase, setPhase } = onboarding
  const { selectionText } = useSelectContext()
  const { data: commands } = useSection(CACHE_SECTIONS.COMMANDS)
  const [calloutElm, setCalloutElm] = useState<Element | null>(null)
  const [returnCalloutElm, setReturnCalloutElm] = useState<Element | null>(null)

  const googleCommand = commands?.find((c) => c.title === "Google")

  const isExplain = phase === StepPhase.EXPLAIN
  const isWaitExecute = phase === StepPhase.WAIT_EXECUTE
  const isWaitReturn = phase === StepPhase.WAIT_RETURN
  const isValueShown = phase === StepPhase.VALUE_SHOWN

  const delays: Partial<Record<StepPhase, PhaseDelays>> = {
    [StepPhase.EXPLAIN]: {
      commandType: 100,
      message: 300,
      rail: 400,
      targetText: 700,
      targetTextCallout: 900,
      callout: 1000,
    },
    [StepPhase.WAIT_EXECUTE]: {
      commandType: 100,
      message: 300,
      rail: 400,
      targetText: 500,
      targetTextCallout: 800,
      callout: 200,
    },
    [StepPhase.WAIT_RETURN]: {
      commandType: 100,
      message: 300,
      rail: 400,
      returnCallout: 1000,
    },
    [StepPhase.VALUE_SHOWN]: {
      commandType: 100,
      message: 300,
      emoji: 500,
      valueSubmessage: 800,
      rail: 1200,
      nextButton: 1400,
    },
  }
  const phaseDelays = delays[phase] ?? delays[StepPhase.EXPLAIN]!

  // The popup menu opens on its own once the sample text is selected
  // (default startup method is text selection).
  useEffect(() => {
    if (!isExplain) return
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
    if (!isWaitExecute || !googleCommand) {
      setCalloutElm(null)
      return
    }
    if (isEmpty(selectionText)) {
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
  }, [isWaitExecute, googleCommand, selectionText])

  // Any search-type command counts here (the callout points at Google
  // specifically, but the default set has several search commands - being
  // lenient matches the PRD's "選択→コマンド→検索" mental model rather than
  // requiring one exact command).
  useEffect(() => {
    if (!isWaitExecute) return
    return subscribeCommandExecuted(({ commandType }) => {
      if (
        OPEN_MODE_TYPE_MAP[commandType as keyof typeof OPEN_MODE_TYPE_MAP] !==
        COMMAND_TYPE.SEARCH
      ) {
        return
      }
      onboarding.recordCommandExecuted(OnboardingStep.SEARCH, commandType)
      setPhase(StepPhase.WAIT_RETURN)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // The search command opens in a separate browser window (see
  // Popup.execute -> BgCommand.openPopup -> chrome.windows.create), not a
  // tab in this same window. Switching focus between two on-screen windows
  // doesn't reliably fire `visibilitychange` (that API tracks tab
  // occlusion/minimization, not window focus), so a `focus` listener on
  // this window is needed to reliably detect the user clicking back onto
  // the onboarding window.
  useEffect(() => {
    if (!isWaitReturn) return

    const elm = document.querySelector(
      "[data-testid='onboarding-step1-callout-anchor']",
    )
    setReturnCalloutElm(elm)

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        setPhase(StepPhase.VALUE_SHOWN, 100)
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

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-10",
        !isValueShown && !isWaitReturn && "select-none",
        isWaitReturn && "pb-40",
      )}
    >
      <OnboardingFadeIn key={"command-type"} delay={phaseDelays.commandType}>
        <h2 className="text-4xl font-bold text-slate-700 flex items-center">
          <span className="font-mono">1.</span>{" "}
          {t("Option_commandType_search_title")}
        </h2>
      </OnboardingFadeIn>

      <div className="flex flex-col items-center gap-4">
        <OnboardingFadeIn
          key={
            isValueShown
              ? "value-message"
              : isWaitReturn
                ? "return-hint"
                : "explain"
          }
          className="flex flex-col items-center gap-4"
          delay={phaseDelays.message}
        >
          <p className="max-w-xl text-xl leading-[1.75] font-semibold text-slate-900">
            {isValueShown ? (
              <>
                <span>{t("onboarding_step1ValueMessage")}</span>
                <span
                  className="ml-1 inline-block animate-onboarding-pop-2 motion-reduce:animate-none"
                  style={{ animationDelay: `${phaseDelays.emoji}ms` }}
                >
                  🎉
                </span>
              </>
            ) : isWaitReturn ? (
              t("onboarding_step1ReturnHint")
            ) : (
              t("onboarding_step1Explain")
            )}
          </p>
        </OnboardingFadeIn>

        {isValueShown && (
          <OnboardingFadeIn
            key="value-submessage"
            delay={phaseDelays.valueSubmessage}
          >
            <p className="max-w-xl text-base text-slate-700 text-pretty">
              {t("onboarding_step1ValueSubmessage")}
            </p>
          </OnboardingFadeIn>
        )}

        <OnboardingFadeIn
          key={isValueShown ? "rail-complete" : "rail"}
          delay={phaseDelays.rail}
          className={isValueShown ? undefined : "pb-14"}
        >
          <OnboardingRail
            selectLabel={t("onboarding_railSelect")}
            commandLabel={t("onboarding_railCommand")}
            resultLabel={t("onboarding_railResultSearch")}
            activeBeat={isValueShown ? -1 : railBeat(phase)}
            size="lg"
          />
        </OnboardingFadeIn>
      </div>

      {(isExplain || isWaitExecute) && (
        <>
          <OnboardingFadeIn key={"target-text"} delay={phaseDelays.targetText}>
            <OnboardingTargetText
              text={t("onboarding_step1TargetText")}
              selected={!isExplain}
              calloutDelay={phaseDelays.targetTextCallout}
            />
          </OnboardingFadeIn>
          <OnboardingCallout
            targetElm={calloutElm}
            open={calloutElm != null}
            openDelay={phaseDelays.callout}
            contentClassName="duration-300"
          >
            {t("onboarding_step1Callout")}
          </OnboardingCallout>
        </>
      )}

      {isWaitReturn && (
        <>
          <span
            className="size-8 shrink-0 rounded-full bg-sky-950/[0.14] text-sky-950 animate-onboarding-blink motion-reduce:animate-none"
            data-testid="onboarding-step1-callout-anchor"
          />
          <OnboardingCallout
            targetElm={returnCalloutElm}
            open={returnCalloutElm != null}
            openDelay={phaseDelays.returnCallout}
            contentClassName="duration-300"
          >
            {t("onboarding_step1Callout_2")}
          </OnboardingCallout>
        </>
      )}

      {isValueShown && (
        <OnboardingFadeIn key="next-button" delay={phaseDelays.nextButton}>
          <button
            type="button"
            onClick={() => onboarding.goToStep(OnboardingStep.AI_PROMPT)}
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
