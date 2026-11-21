import type { ExperimentVariant } from "@/services/experiments"

export type OnboardingBackground = "vignette" | "glow"

// How the sample text card asks to be selected. "drag" selects the whole
// sentence; "doubleClick" marks one word in it and asks for a double-click,
// Chrome's native word selection, so the gesture is the same one users go on
// to use on real pages.
export type OnboardingSelectGesture = "drag" | "doubleClick"

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
  // Gesture the Step 1 (search) card asks for. Step 2 (AI prompt) always
  // asks for a drag, since a single word makes no sense as a prompt.
  searchSelectGesture: OnboardingSelectGesture
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

const DEFAULT_UI: OnboardingVariantUi = {
  background: "vignette",
  welcome: DEFAULT_WELCOME_UI,
  searchSelectGesture: "drag",
}

// Variant F keeps onboarding_v5's variant E look (the welcome glow carried
// over as the page background, with the step rail), but goes back to
// variant C's welcome timing: E's slower welcome coincided with more users
// leaving before their first selection without ever pressing Skip (#573).
// Only the glow's center moves, to where the layout's glow sits, so the
// handoff to the first step lines up. Step 1 asks for a double-click.
const VARIANT_F_UI: OnboardingVariantUi = {
  background: "glow",
  welcome: { ...DEFAULT_WELCOME_UI, glowCenter: "50% 48%" },
  searchSelectGesture: "doubleClick",
}

export const getVariantUi = (
  variant: ExperimentVariant,
): OnboardingVariantUi => (variant === "F" ? VARIANT_F_UI : DEFAULT_UI)
