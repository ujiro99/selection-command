import { t } from "@/services/i18n"
import { ChevronRight } from "lucide-react"
import { OnboardingFadeIn } from "../OnboardingFadeIn"
import { OnboardingStep } from "@/types/onboarding"
import type { UseOnboardingState } from "../useOnboardingState"

const ICON_URL = chrome.runtime.getURL("SelectionCommandLogo.png")

type Props = {
  onboarding: UseOnboardingState
}

// Step0: the landing screen shown right after install.
export function StepIntro({ onboarding }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-16">
      <OnboardingFadeIn delay={200} className="flex items-center">
        <img
          src={ICON_URL}
          className={"block h-[50px]"}
          alt="Logo of selection command"
          aria-hidden
        />
      </OnboardingFadeIn>

      <div>
        <OnboardingFadeIn delay={500}>
          <h1 className="max-w-xl text-3xl font-bold tracking-tight text-slate-900">
            {t("onboarding_step0Title")}
          </h1>
        </OnboardingFadeIn>
        <OnboardingFadeIn delay={600}>
          <p className="max-w-xl mt-5 text-xl leading-[1.85] text-slate-600">
            {t("onboarding_step0Body")}
          </p>
        </OnboardingFadeIn>
      </div>
      <OnboardingFadeIn delay={800} className="flex justify-center">
        <button
          type="button"
          className="flex items-center gap-2 min-h-14 rounded-xl bg-sky-950 pl-8 pr-5 text-lg font-semibold text-white shadow-[0_10px_20px_-14px_rgba(15,23,42,.7)] hover:brightness-[1.35]"
          onClick={() => onboarding.goToStep(OnboardingStep.SEARCH)}
        >
          {t("onboarding_startButton")}
          <ChevronRight className="inline-block size-5" />
        </button>
      </OnboardingFadeIn>
    </div>
  )
}
