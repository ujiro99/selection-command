import { ReactNode } from "react"
import { t } from "@/services/i18n"
import { getProgress, showsSkip } from "./onboardingProgress"
import type { OnboardingStep } from "@/types/onboarding"

const ICON_URL = chrome.runtime.getURL("icon128.png")

type Props = {
  step: OnboardingStep
  onSkip: () => void
  children: ReactNode
}

// Shared chrome around every onboarding step: a constant-strength vignette
// (unlike the old per-step OnboardingOverlay spotlight, this never changes
// between screens, so nothing about the background shifts on transition),
// a header with the brand mark and a 4-segment progress indicator, and a
// Skip button fixed to the bottom-right corner. Individual step components
// now render only their own content.
export function OnboardingLayout({ step, onSkip, children }: Props) {
  const progress = getProgress(step)

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(56%_50%_at_50%_50%,rgba(15,23,42,0)_0%,rgba(15,23,42,0)_52%,rgba(15,23,42,0.12)_100%)]"
      />

      <div className="relative z-10 flex items-center justify-between px-10 py-5">
        <div className="flex items-center gap-2">
          <img src={ICON_URL} alt="" className="block size-6 rounded-md" />
          <span className="text-sm font-semibold tracking-wide text-slate-700">
            Selection Command
          </span>
        </div>

        {progress && (
          <div className="flex items-center gap-3.5">
            <div className="flex gap-1.5">
              {progress.pills.map((pill, i) => (
                <span
                  key={i}
                  className={
                    pill === "todo"
                      ? "h-1 w-[26px] rounded-full bg-slate-200"
                      : "h-1 w-[26px] rounded-full bg-[#082f49]"
                  }
                />
              ))}
            </div>
            <span className="text-xs font-bold tracking-wide text-slate-500 [font-variant-numeric:tabular-nums]">
              {progress.current} / {progress.total}
            </span>
          </div>
        )}
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-10 pb-16 text-center">
        {children}
      </div>

      {showsSkip(step) && (
        <button
          type="button"
          onClick={onSkip}
          className="absolute right-[30px] bottom-6 z-20 inline-flex min-h-11 items-center rounded-md px-3.5 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        >
          {t("onboarding_skipButton")}
        </button>
      )}
    </div>
  )
}
