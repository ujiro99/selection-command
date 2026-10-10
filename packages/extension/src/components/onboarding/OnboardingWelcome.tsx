import { useCallback, useEffect, useRef, useState } from "react"
import clsx from "clsx"
import { t } from "@/services/i18n"
import { OnboardingFadeIn } from "./OnboardingFadeIn"

const ICON_URL = chrome.runtime.getURL("SelectionCommandLogo.png")

/** How long the overlay stays up before advancing on its own. */
export const WELCOME_DURATION_MS = 2200

/** Keep in sync with the onboarding-blur-out duration in tailwind.config.js. */
const EXIT_DURATION_MS = 320

/** How long after mount the background glow starts to bloom. */
const GLOW_DELAY_MS = 100

// Center of the background glow, slightly above the middle of the screen.
// Also used as the bloom animation's transform origin so the glow grows
// from its own center instead of drifting upward while it scales.
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
  onDone: () => void
}

// Variant C's opening beat, replacing variant A's INTRO step: the brand mark
// and a short greeting, then straight into the first step. Rendered as an
// opaque full-screen overlay so the layout chrome (progress pills, Skip)
// stays hidden until the greeting is done, matching how INTRO looks in
// variant A. Advances on its own after WELCOME_DURATION_MS, or immediately
// when the user clicks - there is nothing to read here, so making people
// wait out the timer would just be a second thing to sit through.
export function OnboardingWelcome({ onDone }: Props) {
  const [exiting, setExiting] = useState(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const finishedRef = useRef(false)

  // Read through a ref so `finish` - and with it the auto-advance effect
  // below - stays referentially stable. Callers pass an inline callback, so
  // depending on `onDone` directly would clear and restart the pending 2s
  // timer on every re-render of the parent, and a busy parent could keep
  // the overlay up indefinitely.
  const onDoneRef = useRef(onDone)
  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  const finish = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    setExiting(true)
    timersRef.current.push(
      setTimeout(() => onDoneRef.current(), EXIT_DURATION_MS),
    )
  }, [])

  useEffect(() => {
    timersRef.current.push(setTimeout(finish, WELCOME_DURATION_MS))
    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
  }, [finish])

  return (
    <button
      type="button"
      autoFocus
      onClick={finish}
      aria-label={t("onboarding_welcomeContinue")}
      data-testid="onboarding-welcome"
      className={clsx(
        "fixed inset-0 z-30 flex cursor-default flex-col items-center justify-center gap-10 overflow-hidden bg-white",
        exiting && "animate-onboarding-blur-out motion-reduce:animate-none",
      )}
    >
      {/* Negative z-index keeps the glow above the white background but
          behind the greeting, even when the animations are disabled. */}
      <span
        aria-hidden
        data-testid="onboarding-welcome-glow"
        className="pointer-events-none absolute inset-0 -z-10 animate-onboarding-glow-in motion-reduce:animate-none"
        style={{
          backgroundImage: GLOW_BACKGROUND,
          transformOrigin: GLOW_CENTER,
          animationDelay: `${GLOW_DELAY_MS}ms`,
        }}
      />
      <OnboardingFadeIn effect="blur" delay={100} className="-mt-10">
        <img src={ICON_URL} className="block h-[50px]" alt="" aria-hidden />
      </OnboardingFadeIn>
      <OnboardingFadeIn effect="blur" delay={300}>
        <p className="text-3xl font-bold tracking-tight text-slate-900">
          {t("onboarding_welcomeMessage")}
        </p>
      </OnboardingFadeIn>
      <OnboardingFadeIn effect="blur" delay={600}>
        <p className="text-2xl font-normal text-slate-900">
          {t("onboarding_welcomeIntroduction")}
        </p>
      </OnboardingFadeIn>
    </button>
  )
}
