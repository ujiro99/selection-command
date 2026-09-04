import { Settings, Share2, ChevronRight } from "lucide-react"
import { t } from "@/services/i18n"
import { OnboardingFadeIn } from "../OnboardingFadeIn"
import { OnboardingStep } from "@/types/onboarding"
import type { UseOnboardingState } from "../useOnboardingState"

type Props = {
  onboarding: UseOnboardingState
}

const OPTION_SCREEN_URL = chrome.runtime.getURL("onboarding/OptionScreen.png")
const HUB_SCREEN_URL = chrome.runtime.getURL("onboarding/HubScreen.png")

// Step4: EXPLAIN-only wrap-up telling the user the sample commands seen in
// Steps 1-3 can be added to or edited from either the settings screen or
// the Command Hub. Both panels below are screenshots of those real screens,
// not live links - per the PRD, Step4 is a lightweight pointer, not a place
// to start a real editing/browsing flow mid-onboarding.
export function StepCustomize({ onboarding }: Props) {
  return (
    <div className="flex flex-col items-center gap-10 !h-[540px]">
      <OnboardingFadeIn key="title" delay={100}>
        <h2 className="text-4xl font-bold text-slate-700 flex items-center">
          <span className="font-mono">4.</span> {t("onboarding_step4_title")}
        </h2>
      </OnboardingFadeIn>

      <OnboardingFadeIn key="explain" delay={300}>
        <p className="max-w-xl text-xl leading-[1.75] font-semibold text-slate-900">
          {t("onboarding_step4Explain")}
          <span
            className="ml-1 inline-block animate-onboarding-pop-2 motion-reduce:animate-none"
            style={{ animationDelay: "600ms" }}
          >
            🎉
          </span>
        </p>
      </OnboardingFadeIn>

      <div className="grid w-[884px] grid-cols-2 gap-12">
        <OnboardingFadeIn key="option-screen" delay={1000}>
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-left text-sm font-bold text-slate-700">
              <span className="flex size-6 items-center justify-center rounded-md bg-sky-950/[0.1] text-sky-950">
                <Settings className="size-4" strokeWidth={2} />
              </span>
              {t("onboarding_step4SettingsHeading")}
            </div>
            <div className="h-[226px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.04),0_16px_32px_-26px_rgba(15,23,42,.35)]">
              <img
                src={OPTION_SCREEN_URL}
                alt=""
                className="h-full w-full object-cover object-top"
              />
            </div>
          </div>
        </OnboardingFadeIn>

        <OnboardingFadeIn key="hub-screen" delay={1200}>
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-left text-sm font-bold text-slate-700">
              <span className="flex size-6 items-center justify-center rounded-md bg-sky-950/[0.1] text-sky-950">
                <Share2 className="size-4" strokeWidth={2} />
              </span>
              {t("onboarding_step4HubHeading")}
            </div>
            <div className="h-[226px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.04),0_16px_32px_-26px_rgba(15,23,42,.35)]">
              <img
                src={HUB_SCREEN_URL}
                alt=""
                className="h-full w-full object-cover object-top"
              />
            </div>
          </div>
        </OnboardingFadeIn>
      </div>

      <OnboardingFadeIn key="next-button" delay={1400}>
        <button
          type="button"
          className="mt-4 flex items-center gap-2 min-h-14 rounded-xl bg-sky-950 pl-8 pr-5 text-lg font-semibold text-white shadow-[0_10px_20px_-14px_rgba(15,23,42,.7)] hover:brightness-[1.35]"
          onClick={() => onboarding.goToStep(OnboardingStep.COMPLETE)}
        >
          {t("onboarding_nextButton")}
          <ChevronRight className="inline-block size-5" />
        </button>
      </OnboardingFadeIn>
    </div>
  )
}
