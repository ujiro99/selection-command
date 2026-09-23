import { ReactNode } from "react"
import clsx from "clsx"

// `rise` is the default onboarding entrance (fade + slight upward slide).
// `blur` additionally resolves the content out of a blur, used by variant
// B's welcome overlay for a softer, Linear-style transition.
export type FadeInEffect = "rise" | "blur"

type Props = {
  children: ReactNode
  className?: string
  delay?: number // in milliseconds; optional delay before the fade-in starts
  effect?: FadeInEffect
}

const EFFECT_CLASS: Record<FadeInEffect, string> = {
  rise: "animate-onboarding-rise",
  blur: "animate-onboarding-blur-in",
}

// Wraps a block of onboarding explanation text so it fades in from slightly
// below, per the PRD's "説明テキストは少し下からフェードイン" rule. Uses a
// `key`-less CSS animation (re-triggered by React remounting the element,
// e.g. when the step/phase changes) rather than a JS animation library.
export function OnboardingFadeIn({
  children,
  className,
  delay,
  effect = "rise",
}: Props) {
  return (
    <div
      className={clsx(
        "motion-reduce:animate-none",
        EFFECT_CLASS[effect],
        className,
      )}
      style={{ animationDelay: delay ? `${delay}ms` : undefined }}
    >
      {children}
    </div>
  )
}
