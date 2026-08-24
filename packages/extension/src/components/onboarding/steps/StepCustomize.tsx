import { ExternalLink } from "lucide-react"
import { t } from "@/services/i18n"
import { OnboardingFadeIn } from "../OnboardingFadeIn"
import { OnboardingStep } from "@/types/onboarding"
import { NEW_HUB_URL } from "@/const"
import { getHubLocale } from "@/services/hubShare"
import { useHubUser } from "@/hooks/option/useHubUser"
import { UTM_SOURCE, UTM_MEDIUM, withUtmParams } from "@shared"
import type { UseOnboardingState } from "../useOnboardingState"

type Props = {
  onboarding: UseOnboardingState
}

// Step4: EXPLAIN-only wrap-up telling the user the sample commands seen in
// Steps 1-3 can be edited, removed, or added to from the settings page, plus
// a link to the Command Hub to discover more (per the PRD's Step4 - only a
// lightweight pointer here, not a how-to-build-commands explainer).
export function StepCustomize({ onboarding }: Props) {
  const hubUser = useHubUser()
  const locale = getHubLocale()
  const hubLink = withUtmParams(
    hubUser
      ? `${NEW_HUB_URL}/${locale}/dashboard/commands`
      : `${NEW_HUB_URL}/${locale}`,
    { source: UTM_SOURCE.ONBOARDING, medium: UTM_MEDIUM.LINK },
  )

  return (
    <OnboardingFadeIn className="flex flex-col items-center gap-6 py-16 text-center">
      <p className="max-w-md text-base text-gray-600">
        {t("onboarding_step4Explain")}
      </p>
      <a
        href={hubLink}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-600 hover:text-sky-700"
      >
        {t("onboarding_step4HubLink")}
        <ExternalLink className="size-3.5" />
      </a>
      <div className="flex gap-3">
        <button
          type="button"
          className="rounded-md bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
          onClick={() => onboarding.goToStep(OnboardingStep.COMPLETE)}
        >
          {t("onboarding_finishButton")}
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
