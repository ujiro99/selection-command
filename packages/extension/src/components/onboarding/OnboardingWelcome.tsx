import { useCallback, useEffect, useRef, useState } from "react"
import clsx from "clsx"
import { t } from "@/services/i18n"
import { OnboardingFadeIn } from "./OnboardingFadeIn"

const ICON_URL = chrome.runtime.getURL("SelectionCommandLogo.png")

/** How long the overlay stays up before advancing on its own. */
export const WELCOME_DURATION_MS = 2000

/** Keep in sync with the onboarding-blur-out duration in tailwind.config.js. */
const EXIT_DURATION_MS = 320

type Props = {
  onDone: () => void
}

// Variant B's opening beat, replacing variant A's INTRO step: the brand mark
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

  const finish = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    setExiting(true)
    timersRef.current.push(setTimeout(onDone, EXIT_DURATION_MS))
  }, [onDone])

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
        "fixed inset-0 z-30 flex cursor-default flex-col items-center justify-center gap-10 bg-white",
        exiting && "animate-onboarding-blur-out motion-reduce:animate-none",
      )}
    >
      <OnboardingFadeIn effect="blur" delay={100}>
        <img
          src={ICON_URL}
          className="block h-[50px]"
          alt="Logo of selection command"
          aria-hidden
        />
      </OnboardingFadeIn>
      <OnboardingFadeIn effect="blur" delay={300}>
        <p className="text-3xl font-bold tracking-tight text-slate-900">
          {t("onboarding_welcomeMessage")}
        </p>
      </OnboardingFadeIn>
    </button>
  )
}
