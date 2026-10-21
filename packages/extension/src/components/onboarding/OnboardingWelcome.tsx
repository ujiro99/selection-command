import { useCallback, useEffect, useRef, useState } from "react"
import clsx from "clsx"
import { t } from "@/services/i18n"
import { OnboardingFadeIn } from "./OnboardingFadeIn"
import { OnboardingGlow } from "./OnboardingGlow"

const ICON_URL = chrome.runtime.getURL("SelectionCommandLogo.png")

/** How long the overlay stays up before advancing on its own. */
export const WELCOME_DURATION_MS = 2200

/** Keep in sync with the onboarding-blur-out duration in tailwind.config.js. */
const EXIT_DURATION_MS = 320

type Props = {
  onDone: () => void
}

// Variants C and D's opening beat, replacing variant A's INTRO step: the brand mark
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
        "fixed inset-0 z-30 flex cursor-default flex-col items-center justify-center gap-12 overflow-hidden bg-white",
        exiting && "animate-onboarding-blur-out motion-reduce:animate-none",
      )}
    >
      {/* Negative z-index keeps the glow above the white background but
          behind the greeting, even when the animations are disabled. */}
      <OnboardingGlow
        data-testid="onboarding-welcome-glow"
        className="absolute -z-10"
        delay={300}
      />
      <OnboardingFadeIn effect="blur" delay={600} className="-mt-20">
        <img src={ICON_URL} className="block h-12.5" alt="" aria-hidden />
      </OnboardingFadeIn>
      <OnboardingFadeIn effect="blur" delay={900}>
        <p className="text-3xl font-bold tracking-tight text-slate-900">
          {t("onboarding_welcomeMessage")}
        </p>
      </OnboardingFadeIn>
      <OnboardingFadeIn effect="blur" delay={1200}>
        <p className="text-2xl font-normal text-slate-900">
          {t("onboarding_welcomeIntroduction")}
        </p>
      </OnboardingFadeIn>
    </button>
  )
}
