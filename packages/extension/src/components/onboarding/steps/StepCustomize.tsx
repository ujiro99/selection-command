import {
  Settings,
  Grip,
  Plus,
  Search,
  Sparkles,
  Eye,
  ExternalLink,
  Image,
  Languages,
  FileText,
  Hash,
} from "lucide-react"
import { t } from "@/services/i18n"
import { useSection } from "@/hooks/useSettings"
import { CACHE_SECTIONS } from "@/services/settings/settingsCache"
import { ONBOARDING_AI_PROMPT_COMMAND_ID } from "../onboardingCommand"
import { OnboardingFadeIn } from "../OnboardingFadeIn"
import { OnboardingStep } from "@/types/onboarding"
import type { UseOnboardingState } from "../useOnboardingState"

type Props = {
  onboarding: UseOnboardingState
}

const HUB_ROWS = [
  { icon: Image, title: "Google Image" },
  { icon: Languages, title: "Translation" },
  { icon: FileText, title: "Page Summary" },
  { icon: Hash, title: "Character Counter" },
] as const

// Step4: EXPLAIN-only wrap-up telling the user the sample commands seen in
// Steps 1-3 can be added to or edited from either the settings screen or
// the Command Hub. Both panels below are illustrative mockups of those real
// screens, not live links - per the PRD, Step4 is a lightweight pointer,
// not a place to start a real editing/browsing flow mid-onboarding.
export function StepCustomize({ onboarding }: Props) {
  const { data: commands } = useSection(CACHE_SECTIONS.COMMANDS)
  // The AiPrompt command's title is locale-specific product data (see
  // onboardingCommand.ts / defaultSettings.ts), not an i18n message - look
  // it up by its fixed id rather than hardcoding a label that would drift
  // from what Step2 actually showed. Google/Link Preview's titles are the
  // same literal string in every locale, so those stay hardcoded.
  const aiPromptTitle =
    commands?.find((c) => c.id === ONBOARDING_AI_PROMPT_COMMAND_ID)?.title ??
    t("onboarding_railResultAi")

  return (
    <OnboardingFadeIn className="flex flex-col items-center gap-6">
      <p className="max-w-[560px] text-xl leading-[1.75] font-semibold text-slate-900">
        {t("onboarding_step4Explain")}
      </p>

      <div className="grid w-[884px] grid-cols-2 gap-9">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-left text-sm font-bold text-slate-900">
            <span className="flex size-[22px] items-center justify-center rounded-md bg-[#082f49]/[0.14] text-[#082f49]">
              <Settings className="size-3.5" strokeWidth={2} />
            </span>
            {t("onboarding_step4SettingsHeading")}
          </div>
          <div className="min-h-[226px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.04),0_16px_32px_-26px_rgba(15,23,42,.35)]">
            <div className="border-b border-slate-200 bg-slate-50 px-3.5 py-2.5 text-left text-[11.5px] font-bold tracking-wide text-slate-500">
              {t("Option_commands")}
            </div>
            <div className="flex flex-col">
              <SettingsRow icon={Search} title="Google" />
              <SettingsRow icon={Sparkles} title={aiPromptTitle} />
              <SettingsRow icon={Eye} title="Link Preview" />
              <div className="flex items-center gap-2.5 px-3.5 py-3 text-left text-[13px] font-semibold text-slate-500">
                <span className="flex size-[22px] items-center justify-center rounded-md border border-dashed border-slate-300">
                  <Plus className="size-3" strokeWidth={2.4} />
                </span>
                {t("Option_Command_new")}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-left text-sm font-bold text-slate-900">
            <span className="flex size-[22px] items-center justify-center rounded-md bg-[#082f49]/[0.14] text-[#082f49]">
              <ExternalLink className="size-3.5" strokeWidth={2} />
            </span>
            {t("onboarding_step4HubHeading")}
          </div>
          <div className="min-h-[226px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.04),0_16px_32px_-26px_rgba(15,23,42,.35)]">
            <div className="border-b border-slate-200 bg-slate-50 px-3.5 py-2.5 text-left text-[11.5px] font-bold tracking-wide text-slate-500">
              Command Hub
            </div>
            <div className="flex flex-col">
              {HUB_ROWS.map(({ icon: Icon, title }) => (
                <div
                  key={title}
                  className="flex items-center gap-2.5 border-b border-slate-100 px-3.5 py-3 text-left last:border-b-0"
                >
                  <span className="flex size-[22px] items-center justify-center rounded-md bg-slate-100 text-slate-600">
                    <Icon className="size-3.5" strokeWidth={2} />
                  </span>
                  <span className="flex-1 text-[13.5px] font-medium text-slate-700">
                    {title}
                  </span>
                  <span className="rounded-full bg-[#082f49]/[0.14] px-2.5 py-1 text-[11px] font-bold text-[#082f49]">
                    {t("onboarding_step4HubAddChip")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="mt-1 min-h-12 rounded-md bg-[#082f49] px-8 text-[15px] font-semibold text-white shadow-[0_10px_20px_-14px_rgba(15,23,42,.7)] hover:brightness-[1.35]"
        onClick={() => onboarding.goToStep(OnboardingStep.COMPLETE)}
      >
        {t("onboarding_nextButton")}
      </button>
    </OnboardingFadeIn>
  )
}

function SettingsRow({
  icon: Icon,
  title,
}: {
  icon: typeof Search
  title: string
}) {
  return (
    <div className="flex items-center gap-2.5 border-b border-slate-100 px-3.5 py-3 text-left">
      <Grip className="size-3 flex-none text-slate-300" strokeWidth={2} />
      <span className="flex size-[22px] items-center justify-center rounded-md bg-slate-100 text-slate-600">
        <Icon className="size-3.5" strokeWidth={2} />
      </span>
      <span className="text-[13.5px] font-medium text-slate-700">{title}</span>
    </div>
  )
}
