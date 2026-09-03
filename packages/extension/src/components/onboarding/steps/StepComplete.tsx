import { useEffect } from "react"
import { MousePointerClick, PartyPopper } from "lucide-react"
import { t } from "@/services/i18n"
import { OnboardingFadeIn } from "../OnboardingFadeIn"
import { OnboardingConfetti } from "../OnboardingConfetti"
import { closeOnboardingTab } from "../onboardingWindow"
import type { UseOnboardingState } from "../useOnboardingState"

type Props = {
  onboarding: UseOnboardingState
}

// Step5: the final, EXPLAIN-only screen. Marks the onboarding as complete
// (hasShownOnboarding=true, ONBOARDING_COMPLETE analytics event) as soon as
// it's reached, since there's no further step to skip out of.
//
// The primary button closes the tab and returns the user to the page they
// were on - the explanation text already tells them to "select text and
// try it", so the button that actually lets them do that is the one that
// gets top billing; "open settings" (something they can always do later,
// and which Step4 already introduced) is the secondary action.
export function StepComplete({ onboarding }: Props) {
  const { complete } = onboarding

  useEffect(() => {
    complete()
  }, [complete])

  return (
    <>
      <OnboardingConfetti />
      <div className="flex flex-col items-center gap-5">
        <span
          className="flex size-[76px] animate-onboarding-pop items-center justify-center rounded-full bg-green-200 text-green-600 motion-reduce:animate-none motion-reduce:opacity-100"
          style={{ animationDelay: `400ms` }}
        >
          <PartyPopper className="size-9" strokeWidth={1.8} />
        </span>

        <OnboardingFadeIn
          className="flex flex-col items-center gap-5"
          delay={200}
        >
          <h1 className="mt-1 text-[26px] font-bold tracking-tight text-slate-900">
            {t("onboarding_completeTitle")}
          </h1>
        </OnboardingFadeIn>

        <OnboardingFadeIn
          className="flex flex-col items-center gap-5"
          delay={500}
        >
          <p className="max-w-[480px] text-base leading-[1.85] text-slate-600">
            {t("onboarding_completeBody")}
          </p>
        </OnboardingFadeIn>

        <div className="mt-2.5 flex items-center gap-5">
          <OnboardingFadeIn
            className="flex flex-col items-center gap-5"
            delay={700}
          >
            <button
              type="button"
              className="flex items-center gap-3 min-h-14 rounded-xl bg-sky-950 pl-8 pr-6 text-[15px] font-semibold text-white shadow-[0_10px_20px_-14px_rgba(15,23,42,.7)] hover:brightness-[1.35]"
              onClick={() => closeOnboardingTab()}
            >
              {t("onboarding_closeButton")}
              <MousePointerClick className="inline-block size-5" />
            </button>
          </OnboardingFadeIn>
          <OnboardingFadeIn
            className="flex flex-col items-center gap-5"
            delay={900}
          >
            <button
              type="button"
              className="min-h-14 rounded-xl px-5 text-[15px] font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-700"
              onClick={() => chrome.runtime.openOptionsPage()}
            >
              {t("onboarding_openSettingsButton")}
            </button>
          </OnboardingFadeIn>
        </div>
      </div>
    </>
  )
}
