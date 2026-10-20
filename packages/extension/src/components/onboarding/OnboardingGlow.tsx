import clsx from "clsx"

/** How long after mount the glow starts to bloom. */
const GLOW_DELAY_MS = 100

// Center of the glow, slightly above the middle of the screen. Also used as
// the bloom animation's transform origin so the glow grows from its own
// center instead of drifting upward while it scales.
const GLOW_CENTER = "50% 46%"

// Soft brand-blue glow radiating from just above the center of the screen,
// fading to fully transparent well before the edges so it reads as light,
// not a fill.
const GLOW_BACKGROUND = [
  `radial-gradient(ellipse 26% 26% at ${GLOW_CENTER}`,
  "rgb(32 140 190 / 0.24) 0%",
  "rgb(32 140 190 / 0.12) 40%",
  "rgb(32 140 190 / 0) 100%)",
].join(", ")

type Props = {
  // Positioning and stacking, which differ between the welcome overlay and
  // the page layout.
  className?: string
  "data-testid"?: string
}

// Brand-blue radial glow that blooms outward from the center of the screen
// shortly after it mounts. Used by the welcome overlay, and by variant D's
// layout as the background of every step. Both mount at the same time, so
// when the overlay fades out the identical glow is already in place beneath
// it.
export function OnboardingGlow({ className, ...rest }: Props) {
  return (
    <span
      aria-hidden
      className={clsx(
        "pointer-events-none inset-0 animate-onboarding-glow-in motion-reduce:animate-none",
        className,
      )}
      style={{
        backgroundImage: GLOW_BACKGROUND,
        transformOrigin: GLOW_CENTER,
        animationDelay: `${GLOW_DELAY_MS}ms`,
      }}
      {...rest}
    />
  )
}
