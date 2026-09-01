import { useEffect, useRef } from "react"
import { ArrowBigUp, ChevronRight, MousePointerClick } from "lucide-react"
import { t } from "@/services/i18n"
import { DRAG_OPEN_MODE } from "@/const"
import { subscribeCommandExecuted } from "../onboardingEvents"
import { OnboardingFadeIn } from "../OnboardingFadeIn"
import { OnboardingRail } from "../OnboardingRail"
import { OnboardingStep, StepPhase } from "@/types/onboarding"
import type { UseOnboardingState } from "../useOnboardingState"

type Props = {
  onboarding: UseOnboardingState
}

const DRAG_OPEN_MODES: readonly string[] = Object.values(DRAG_OPEN_MODE)

// Step3: Shift+click the sample link to trigger Link Preview. Unlike
// Steps 1-2 this isn't triggered via text selection, so it only ever uses
// the EXPLAIN and VALUE_SHOWN phases - the rail stays on beat 0 the whole
// time it's visible, per the design note that "select" here stands in for
// "pick the target" even though the gesture is a click, not a drag.
export function StepLinkPreview({ onboarding }: Props) {
  const { phase, setPhase } = onboarding
  const linkRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    if (phase !== StepPhase.EXPLAIN) return
    return subscribeCommandExecuted(({ commandType }) => {
      if (!DRAG_OPEN_MODES.includes(commandType)) return
      onboarding.recordCommandExecuted(OnboardingStep.LINK_PREVIEW, commandType)
      setPhase(StepPhase.VALUE_SHOWN)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const valueShown = phase === StepPhase.VALUE_SHOWN

  // Renders through this single return for every phase, including
  // VALUE_SHOWN, instead of branching into a separate <OnboardingValueShown>
  // subtree there - see StepSearchCommand.tsx for why: that would mount a
  // second, independent OnboardingRail, losing the "select -> command ->
  // result" beat animation's continuity right as the payoff screen appears.
  return (
    <div className="flex flex-col items-center gap-10">
      <OnboardingFadeIn key={"command-type"} delay={100}>
        {!valueShown && (
          <h2 className="text-4xl font-bold text-slate-700 h-14 flex items-center">
            <span className="font-mono">3.</span> {t("Option_linkCommand")}
          </h2>
        )}
      </OnboardingFadeIn>

      <div className="flex flex-col items-center gap-4">
        <OnboardingFadeIn
          key={valueShown ? "value-message" : "explain"}
          className="flex flex-col items-center gap-4"
          delay={300}
        >
          <p className="max-w-xl text-xl leading-[1.75] font-semibold text-slate-900">
            {valueShown
              ? t("onboarding_step3ValueMessage")
              : t("onboarding_step3Explain")}
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
            resultLabel={t("onboarding_railResultPreview")}
            activeBeat={valueShown ? -1 : 0}
            size="lg"
          />
        </OnboardingFadeIn>
      </div>

      {valueShown ? (
        <OnboardingFadeIn key="next-button" delay={800}>
          <button
            type="button"
            onClick={() => onboarding.goToStep(OnboardingStep.CUSTOMIZE)}
            className="flex items-center gap-2 min-h-14 rounded-xl bg-sky-950 px-8 text-lg font-semibold text-white shadow-[0_10px_20px_-14px_rgba(15,23,42,.7)] hover:brightness-[1.35]"
          >
            {t("onboarding_nextButton")}
            <ChevronRight className="inline-block size-5" />
          </button>
        </OnboardingFadeIn>
      ) : (
        <OnboardingFadeIn
          key={"target-text"}
          className="flex flex-col items-center gap-4"
          delay={500}
        >
          <div className="flex min-h-[62px] animate-onboarding-ring items-center justify-center rounded-lg border border-slate-200 bg-white px-[30px] py-4.5 [--onboarding-ring-color:rgba(8,47,73,0.16)] motion-reduce:animate-none">
            <a
              ref={linkRef}
              href="https://github.com/ujiro99/selection-command"
              className="text-base text-sky-700 underline decoration-1 underline-offset-[3px] hover:text-sky-800"
              onClick={(e) => e.preventDefault()}
            >
              {t("onboarding_step3LinkLabel")}
            </a>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex min-h-[28px] items-center gap-1.5 rounded-[6px] border border-b-2 border-slate-300 bg-white px-2.5 text-[11.5px] font-bold tracking-wide text-slate-700">
              <ArrowBigUp className="size-3" strokeWidth={2} />
              Shift
            </span>
            <span className="text-xs font-semibold text-slate-500">+</span>
            <span className="inline-flex min-h-[28px] items-center gap-1.5 rounded-[6px] border border-b-2 border-slate-300 bg-white px-2.5 text-[11.5px] font-bold tracking-wide text-slate-700">
              <MousePointerClick className="size-3" strokeWidth={2} />
              {t("onboarding_clickKeycap")}
            </span>
          </div>
        </OnboardingFadeIn>
      )}
    </div>
  )
}
