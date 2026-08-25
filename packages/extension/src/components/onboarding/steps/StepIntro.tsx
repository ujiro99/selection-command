import { t } from "@/services/i18n"
import { OnboardingFadeIn } from "../OnboardingFadeIn"
import { OnboardingStep } from "@/types/onboarding"
import type { UseOnboardingState } from "../useOnboardingState"

const ICON_URL = chrome.runtime.getURL("icon128.png")

type Props = {
  onboarding: UseOnboardingState
}

// Step0: the landing screen shown right after install.
export function StepIntro({ onboarding }: Props) {
  return (
    <OnboardingFadeIn className="flex flex-col items-center gap-5">
      <img src={ICON_URL} alt="" className="block size-[60px]" />
      <h1 className="mt-1 text-[26px] font-bold tracking-tight text-slate-900">
        {t("onboarding_step0Title")}
      </h1>
      <p className="max-w-[440px] text-base leading-[1.85] text-slate-600">
        {t("onboarding_step0Body")}
      </p>
      <button
        type="button"
        className="mt-2.5 min-h-12 rounded-md bg-[#082f49] px-8 text-[15px] font-semibold text-white shadow-[0_10px_20px_-14px_rgba(15,23,42,.7)] hover:brightness-[1.35]"
        onClick={() => onboarding.goToStep(OnboardingStep.SEARCH)}
      >
        {t("onboarding_startButton")}
      </button>
    </OnboardingFadeIn>
  )
}
