import { useEffect } from "react"
import { t } from "@/services/i18n"
import { OnboardingFadeIn } from "../OnboardingFadeIn"
import { closeOnboardingTab } from "../onboardingWindow"
import type { UseOnboardingState } from "../useOnboardingState"

type Props = {
  onboarding: UseOnboardingState
}

// Step5: the final, EXPLAIN-only screen. Marks the onboarding as complete
// (hasShownOnboarding=true, ONBOARDING_COMPLETE analytics event) as soon as
// it's reached, since there's no further step to skip out of.
export function StepComplete({ onboarding }: Props) {
  const { complete } = onboarding

  useEffect(() => {
    complete()
  }, [complete])

  return (
    <OnboardingFadeIn className="flex flex-col items-center gap-6 py-16 text-center">
      <h1 className="text-2xl font-bold">{t("onboarding_completeTitle")}</h1>
      <p className="max-w-md text-base text-gray-600">
        {t("onboarding_completeBody")}
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          className="rounded-md bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          {t("onboarding_openSettingsButton")}
        </button>
        <button
          type="button"
          className="rounded-md px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700"
          onClick={() => closeOnboardingTab()}
        >
          {t("onboarding_closeButton")}
        </button>
      </div>
    </OnboardingFadeIn>
  )
}
