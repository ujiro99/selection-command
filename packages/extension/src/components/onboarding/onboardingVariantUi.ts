import type { ExperimentVariant } from "@/services/experiments"

export type OnboardingBackground = "vignette" | "glow"

// UI differences between onboarding variants, resolved in one place so the
// step components and the layout check a named switch (`ui.showRail`)
// instead of comparing variant letters themselves.
export type OnboardingVariantUi = {
  // Whether Steps 1-3 show the "select -> command -> result" OnboardingRail.
  showRail: boolean
  // "vignette": a constant slate vignette darkening the edges of the page.
  // "glow": the welcome overlay's brand-blue radial glow, kept behind every
  // step (see OnboardingGlow).
  background: OnboardingBackground
}

const DEFAULT_UI: OnboardingVariantUi = {
  showRail: true,
  background: "vignette",
}

// Variant D is variant C simplified: no step rail, and the welcome glow
// carried over as the page background.
const VARIANT_D_UI: OnboardingVariantUi = {
  showRail: false,
  background: "glow",
}

export const getVariantUi = (
  variant: ExperimentVariant,
): OnboardingVariantUi => (variant === "D" ? VARIANT_D_UI : DEFAULT_UI)
