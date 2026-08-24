import { useEffect, useRef } from "react"
import { t } from "@/services/i18n"
import { DRAG_OPEN_MODE } from "@/const"
import { subscribeCommandExecuted } from "../onboardingEvents"
import { OnboardingOverlay } from "../OnboardingOverlay"
import { OnboardingFadeIn } from "../OnboardingFadeIn"
import { OnboardingStep, StepPhase } from "@/types/onboarding"
import type { UseOnboardingState } from "../useOnboardingState"

type Props = {
  onboarding: UseOnboardingState
}

const DRAG_OPEN_MODES: readonly string[] = Object.values(DRAG_OPEN_MODE)

// Step3: Shift+click the sample link to trigger Link Preview. Unlike
// Steps 1-2 this isn't triggered via text selection, so it only ever uses
// the EXPLAIN and VALUE_SHOWN phases.
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

  return (
    <div className="flex flex-col items-center gap-6 py-16 text-center">
      <OnboardingFadeIn key={phase}>
        {phase === StepPhase.VALUE_SHOWN ? (
          <div className="flex flex-col items-center gap-4">
            <p className="max-w-md text-base text-gray-600">
              {t("onboarding_step3ValueMessage")}
            </p>
            <button
              type="button"
              className="rounded-md bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
              onClick={() => onboarding.goToStep(OnboardingStep.CUSTOMIZE)}
            >
              {t("onboarding_nextButton")}
            </button>
          </div>
        ) : (
          <p className="max-w-md text-base text-gray-600">
            {t("onboarding_step3Explain")}
          </p>
        )}
      </OnboardingFadeIn>

      {phase !== StepPhase.VALUE_SHOWN && (
        <a
          ref={linkRef}
          href="https://github.com/ujiro99/selection-command"
          className="rounded-md bg-gray-100 px-4 py-3 text-base text-blue-600 underline"
          onClick={(e) => e.preventDefault()}
        >
          {t("onboarding_step3LinkLabel")}
        </a>
      )}

      {phase === StepPhase.EXPLAIN && <OnboardingOverlay targetRef={linkRef} />}

      <button
        type="button"
        className="text-sm text-gray-400 hover:text-gray-600"
        onClick={onboarding.skip}
      >
        {t("onboarding_skipButton")}
      </button>
    </div>
  )
}
