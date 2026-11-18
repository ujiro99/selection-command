import type { ExperimentVariant } from "@/services/experiments"

export type OnboardingBackground = "vignette" | "glow"

// Timing and spacing of the welcome overlay (see OnboardingWelcome). Delays
// are in milliseconds from mount; class names are full Tailwind literals so
// they survive class scanning.
export type OnboardingWelcomeUi = {
  // How long the overlay stays up before advancing on its own.
  durationMs: number
  glowDelay: number
  // Center of the glow, also used as its bloom transform origin.
  glowCenter: string
  logoDelay: number
  messageDelay: number
  introductionDelay: number
  // Vertical gap between the logo, the greeting and the introduction.
  gapClassName: string
  // Nudges the stack upward so it sits on the glow's center.
  logoClassName: string
}

// UI differences between onboarding variants, resolved in one place so the
// step components and the layout check a named switch (`ui.background`)
// instead of comparing variant letters themselves.
export type OnboardingVariantUi = {
  // "vignette": a constant slate vignette darkening the edges of the page.
  // "glow": the welcome overlay's brand-blue radial glow, kept behind every
  // step (see OnboardingGlow).
  background: OnboardingBackground
  welcome: OnboardingWelcomeUi
}

// Variant C's welcome overlay, unchanged so the control arm stays as shipped.
export const DEFAULT_WELCOME_UI: OnboardingWelcomeUi = {
  durationMs: 2200,
  glowDelay: 100,
  glowCenter: "50% 46%",
  logoDelay: 100,
  messageDelay: 300,
  introductionDelay: 600,
  gapClassName: "gap-10",
  logoClassName: "-mt-10",
}

// Variant E staggers the welcome more slowly and centers its glow where the
// layout's glow sits, so the handoff to the first step lines up. The
// duration is extended by the same 600ms the last fade-in was pushed back,
// keeping the 800ms hold after everything has appeared that variant C has.
const VARIANT_E_WELCOME_UI: OnboardingWelcomeUi = {
  durationMs: 2800,
  glowDelay: 300,
  glowCenter: "50% 48%",
  logoDelay: 600,
  messageDelay: 900,
  introductionDelay: 1200,
  gapClassName: "gap-12",
  logoClassName: "-mt-20",
}

const DEFAULT_UI: OnboardingVariantUi = {
  background: "vignette",
  welcome: DEFAULT_WELCOME_UI,
}

// Variant E is variant C with the welcome glow carried over as the page
// background and a slower welcome. It is onboarding_v4's variant D with the
// step rail restored, since dropping the rail coincided with more users
// leaving before their first text selection.
const VARIANT_E_UI: OnboardingVariantUi = {
  background: "glow",
  welcome: VARIANT_E_WELCOME_UI,
}

export const getVariantUi = (
  variant: ExperimentVariant,
): OnboardingVariantUi => (variant === "E" ? VARIANT_E_UI : DEFAULT_UI)
