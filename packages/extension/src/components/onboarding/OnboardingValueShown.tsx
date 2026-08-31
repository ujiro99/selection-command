import { ChevronRight } from "lucide-react"
import { t } from "@/services/i18n"
import { OnboardingRail } from "./OnboardingRail"
import { OnboardingFadeIn } from "./OnboardingFadeIn"

type Props = {
  message: string
  resultLabel: string
  onNext: () => void
  titleRenderer?: () => React.ReactNode
}

// The payoff screen shown once a step's VALUE_SHOWN phase is reached
// (Steps 1-3 all end here): a checkmark, the step's value message, and the
// select -> command -> result rail with every beat marked done - the
// PRD's "説明 → 操作 → 成功 → 理解" loop closing out.
export function OnboardingValueShown({
  message,
  resultLabel,
  onNext,
  titleRenderer,
}: Props) {
  return (
    <div className="flex flex-col items-center gap-10">
      {titleRenderer?.()}

      <OnboardingFadeIn
        key={"message"}
        className="flex flex-col items-center gap-4"
        delay={300}
      >
        <p className="max-w-[520px] text-xl leading-[1.75] font-semibold text-slate-900">
          {message}
        </p>

        <OnboardingRail
          selectLabel={t("onboarding_railSelect")}
          commandLabel={t("onboarding_railCommand")}
          resultLabel={resultLabel}
          activeBeat={-1}
          size="lg"
        />
      </OnboardingFadeIn>

      <button
        type="button"
        onClick={onNext}
        className="flex items-center gap-2 min-h-14 rounded-xl bg-sky-950 px-8 text-lg font-semibold text-white shadow-[0_10px_20px_-14px_rgba(15,23,42,.7)] hover:brightness-[1.35]"
      >
        {t("onboarding_nextButton")}
        <ChevronRight className="inline-block size-5" />
      </button>
    </div>
  )
}
