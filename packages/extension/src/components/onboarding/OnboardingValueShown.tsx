import { Check } from "lucide-react"
import { t } from "@/services/i18n"
import { OnboardingRail } from "./OnboardingRail"

type Props = {
  message: string
  resultLabel: string
  onNext: () => void
}

// The payoff screen shown once a step's VALUE_SHOWN phase is reached
// (Steps 1-3 all end here): a checkmark, the step's value message, and the
// select -> command -> result rail with every beat marked done - the
// PRD's "説明 → 操作 → 成功 → 理解" loop closing out.
export function OnboardingValueShown({ message, resultLabel, onNext }: Props) {
  return (
    <div className="flex flex-col items-center gap-5">
      <span className="flex size-14 animate-onboarding-pop items-center justify-center rounded-full bg-[#082f49]/[0.14] text-[#082f49] motion-reduce:animate-none motion-reduce:opacity-100">
        <Check className="size-[26px]" strokeWidth={2.6} />
      </span>

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

      <button
        type="button"
        onClick={onNext}
        className="mt-1 min-h-12 rounded-md bg-[#082f49] px-8 text-[15px] font-semibold text-white shadow-[0_10px_20px_-14px_rgba(15,23,42,.7)] hover:brightness-[1.35]"
      >
        {t("onboarding_nextButton")}
      </button>
    </div>
  )
}
