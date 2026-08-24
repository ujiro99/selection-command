import { t } from "@/services/i18n"
import { OnboardingFadeIn } from "../OnboardingFadeIn"
import { OnboardingStep } from "@/types/onboarding"
import type { UseOnboardingState } from "../useOnboardingState"

type Props = {
  onboarding: UseOnboardingState
}

// Step0: the landing screen shown right after install.
export function StepIntro({ onboarding }: Props) {
  return (
    <OnboardingFadeIn className="flex flex-col items-center gap-6 py-16 text-center">
      <h1 className="text-2xl font-bold">{t("onboarding_step0Title")}</h1>
      <p className="max-w-md text-base text-gray-600">
        {t("onboarding_step0Body")}
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          className="rounded-md bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
          onClick={() => onboarding.goToStep(OnboardingStep.SEARCH)}
        >
          {t("onboarding_startButton")}
        </button>
        <button
          type="button"
          className="rounded-md px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700"
          onClick={onboarding.skip}
        >
          {t("onboarding_skipButton")}
        </button>
      </div>
    </OnboardingFadeIn>
  )
}
