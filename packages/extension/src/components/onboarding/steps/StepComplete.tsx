import { useEffect } from "react"
import { MousePointerClick, PartyPopper, Settings } from "lucide-react"
import { t } from "@/services/i18n"
import { OnboardingFadeIn } from "../OnboardingFadeIn"
import { OnboardingConfetti } from "../OnboardingConfetti"
import { closeOnboardingTab } from "../onboardingWindow"
import { renderMultiline } from "../textUtils"
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
  const delays = [600, 200, 800, 1000, 1200] // ms

  useEffect(() => {
    complete()
  }, [complete])

  return (
    <>
      <OnboardingConfetti />
      <div className="flex flex-col items-center gap-8">
        <span
          className="flex size-19 animate-onboarding-pop items-center justify-center rounded-full bg-green-200 dark:bg-green-900 text-green-600 dark:text-green-400 motion-reduce:animate-none motion-reduce:opacity-100"
          style={{ animationDelay: `${delays[0]}ms` }}
        >
          <PartyPopper className="size-9" strokeWidth={1.8} />
        </span>

        <OnboardingFadeIn
          className="flex flex-col items-center gap-5"
          delay={delays[1]}
        >
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-700 dark:text-slate-300">
            {t("onboarding_completeTitle")}
          </h1>
        </OnboardingFadeIn>

        <OnboardingFadeIn
          className="flex flex-col items-center gap-5"
          delay={delays[2]}
        >
          <p className="max-w-lg text-lg leading-[1.85] text-slate-700 dark:text-slate-300 text-pretty">
            {renderMultiline(t("onboarding_completeBody"))}
          </p>
        </OnboardingFadeIn>

        <div className="mt-4 flex items-center gap-5">
          <OnboardingFadeIn
            className="flex flex-col items-center gap-5"
            delay={delays[3]}
          >
            <button
              type="button"
              className="flex items-center gap-3 min-h-14 rounded-xl bg-sky-950 dark:bg-sky-700 pl-6 pr-8 text-[15px] font-semibold text-white shadow-[0_10px_20px_-14px_rgba(15,23,42,.7)] hover:brightness-[1.35]"
              onClick={() => closeOnboardingTab()}
            >
              <MousePointerClick className="inline-block size-5" />
              {t("onboarding_closeButton")}
            </button>
          </OnboardingFadeIn>
          <OnboardingFadeIn
            className="flex flex-col items-center gap-5"
            delay={delays[4]}
          >
            <button
              type="button"
              className="flex items-center gap-3 min-h-14 rounded-xl px-5 text-[15px] font-medium text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-700 dark:hover:text-slate-300"
              onClick={() => chrome.runtime.openOptionsPage()}
            >
              <Settings className="inline-block size-4" />
              {t("onboarding_openSettingsButton")}
            </button>
          </OnboardingFadeIn>
        </div>
      </div>
    </>
  )
}
