import { useEffect, useState } from "react"
import { ChevronRight, ArrowBigUp, MousePointerClick } from "lucide-react"
import { t } from "@/services/i18n"
import { DRAG_OPEN_MODE } from "@/const"
import { subscribeCommandExecuted } from "../onboardingEvents"
import { OnboardingCallout } from "../OnboardingCallout"
import { OnboardingFadeIn } from "../OnboardingFadeIn"
import { OnboardingRail } from "../OnboardingRail"
import { renderMultiline } from "../textUtils"
import { OnboardingStep, StepPhase } from "@/types/onboarding"
import type { UseOnboardingState } from "../useOnboardingState"

type Props = {
  onboarding: UseOnboardingState
}

const DRAG_OPEN_MODES: readonly string[] = Object.values(DRAG_OPEN_MODE)

// WAIT_RETURN counts as the rail's "result" beat, same as StepSearchCommand -
// the preview already opened, we're just waiting for the user to switch back.
function railBeat(phase: StepPhase): 0 | 2 {
  if (phase === StepPhase.WAIT_RETURN) return 2
  return 0
}

// Step3: Shift+click the sample link to trigger Link Preview. Unlike
// Steps 1-2 this isn't triggered via text selection, so it only ever uses
// the EXPLAIN, WAIT_RETURN and VALUE_SHOWN phases - per the design note
// that "select" here stands in for "pick the target" even though the
// gesture is a click, not a drag.
export function StepLinkPreview({ onboarding }: Props) {
  const { phase, setPhase } = onboarding
  const [linkElm, setLinkElm] = useState<HTMLElement | null>(null)
  const [returnCalloutElm, setReturnCalloutElm] = useState<Element | null>(null)

  const isExplain = phase === StepPhase.EXPLAIN
  const isWaitReturn = phase === StepPhase.WAIT_RETURN
  const isValueShown = phase === StepPhase.VALUE_SHOWN

  // ms, nested by phase since the same element (e.g. next-button) can have
  // a different delay depending on which phase is currently showing it.
  // Each phase only fills in the keys it actually renders. Step3 only ever
  // uses EXPLAIN, WAIT_RETURN and VALUE_SHOWN (see the component doc
  // comment below), so there's no waitExecute group here.
  type PhaseDelays = {
    commandType: number
    message: number
    rail: number
    targetText?: number
    callout?: number
    returnCallout?: number
    emoji?: number
    valueSubmessage?: number
    nextButton?: number
  }
  const delays: Partial<Record<StepPhase, PhaseDelays>> = {
    [StepPhase.EXPLAIN]: {
      commandType: 100,
      message: 300,
      rail: 400,
      targetText: 500,
      callout: 800,
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

  useEffect(() => {
    if (isWaitReturn) {
      const elm = document.querySelector(
        "[data-testid='onboarding-step3-callout-anchor']",
      )
      setReturnCalloutElm(elm)
    } else {
      setReturnCalloutElm(null)
    }

    if (!isExplain) return

    return subscribeCommandExecuted(({ commandType }) => {
      if (!DRAG_OPEN_MODES.includes(commandType)) return
      onboarding.recordCommandExecuted(OnboardingStep.LINK_PREVIEW, commandType)
      setPhase(StepPhase.WAIT_RETURN)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // The preview opens in a separate browser window/tab, so switching focus
  // back doesn't reliably fire `visibilitychange` alone (that API tracks tab
  // occlusion/minimization, not window focus) - a `focus` listener on this
  // window is needed too, to reliably detect the user clicking back onto the
  // onboarding window. See StepSearchCommand.tsx for the same pattern.
  useEffect(() => {
    if (!isWaitReturn) return

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        setPhase(StepPhase.VALUE_SHOWN, 100)
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

  // Renders through this single return for every phase, including
  // VALUE_SHOWN, instead of branching into a separate <OnboardingValueShown>
  // subtree there - see StepSearchCommand.tsx for why: that would mount a
  // second, independent OnboardingRail, losing the "select -> command ->
  // result" beat animation's continuity right as the payoff screen appears.
  return (
    <div className="flex flex-col items-center gap-10">
      <OnboardingFadeIn key={"command-type"} delay={phaseDelays.commandType}>
        <h2 className="text-4xl font-bold text-slate-700 flex items-center">
          <span className="font-mono">3.</span> {t("Option_linkCommand")}
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
                <span>{t("onboarding_step3ValueMessage")}</span>
                <span
                  className="ml-1 inline-block animate-onboarding-pop-2 motion-reduce:animate-none"
                  style={{ animationDelay: `${phaseDelays.emoji}ms` }}
                >
                  🎉
                </span>
              </>
            ) : isWaitReturn ? (
              t("onboarding_step3ReturnHint")
            ) : (
              t("onboarding_step3Explain")
            )}
          </p>
        </OnboardingFadeIn>

        {isValueShown && (
          <OnboardingFadeIn
            key="value-submessage"
            delay={phaseDelays.valueSubmessage}
          >
            <p className="max-w-xl text-base text-slate-700 text-pretty">
              {renderMultiline(t("onboarding_step3ValueSubmessage"))}
            </p>
          </OnboardingFadeIn>
        )}

        <OnboardingFadeIn
          key={isValueShown ? "rail-complete" : "rail"}
          delay={phaseDelays.rail}
        >
          <OnboardingRail
            selectLabel={t("onboarding_railSelect")}
            commandLabel={t("onboarding_railCommand")}
            resultLabel={t("onboarding_railResultPreview")}
            activeBeat={isValueShown ? -1 : railBeat(phase)}
            size="lg"
          />
        </OnboardingFadeIn>
      </div>

      {isExplain && (
        <OnboardingFadeIn
          key={"target-text"}
          className="mt-24 flex flex-col items-center gap-8"
          delay={phaseDelays.targetText}
        >
          <div
            className="flex animate-onboarding-ring items-center justify-center rounded-lg border border-slate-200 bg-white [--onboarding-ring-color:rgba(8,47,73,0.16)] motion-reduce:animate-none"
            ref={setLinkElm}
          >
            <a
              href="https://github.com/ujiro99/selection-command"
              className="text-base px-6 py-3 text-sky-700 underline decoration-1 underline-offset-[3px] hover:text-sky-800"
              onClick={(e) => e.preventDefault()}
            >
              {t("onboarding_step3LinkLabel")}
            </a>
          </div>

          <OnboardingCallout
            targetElm={linkElm}
            open={linkElm != null}
            openDelay={phaseDelays.callout}
            contentClassName="duration-300 select-none"
          >
            <div className="flex flex-col items-center gap-2 pb-1">
              {t("onboarding_step3Callout")}
              <div className="flex items-center gap-2">
                <span className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-b-2 border-slate-300 bg-white px-2.5 text-xs font-bold tracking-wide text-slate-700">
                  <ArrowBigUp className="size-4" strokeWidth={2} />
                  Shift
                </span>
                <span className="text-xs font-semibold text-slate-500">+</span>
                <span className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-b-2 border-slate-300 bg-white px-2.5 text-xs font-bold tracking-wide text-slate-700">
                  <MousePointerClick className="size-4" strokeWidth={2} />
                  {t("onboarding_clickKeycap")}
                </span>
              </div>
            </div>
          </OnboardingCallout>
        </OnboardingFadeIn>
      )}

      {isWaitReturn && (
        <>
          <span
            className="mt-10 size-8 shrink-0 rounded-full bg-sky-950/[0.14] text-sky-950 animate-onboarding-blink motion-reduce:animate-none"
            data-testid="onboarding-step3-callout-anchor"
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
            onClick={() => onboarding.goToStep(OnboardingStep.CUSTOMIZE)}
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
