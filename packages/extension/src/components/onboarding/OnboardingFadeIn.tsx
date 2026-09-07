import { ReactNode } from "react"
import clsx from "clsx"

type Props = {
  children: ReactNode
  className?: string
  delay?: number // in milliseconds; optional delay before the fade-in starts
}

// Wraps a block of onboarding explanation text so it fades in from slightly
// below, per the PRD's "説明テキストは少し下からフェードイン" rule. Uses a
// `key`-less CSS animation (re-triggered by React remounting the element,
// e.g. when the step/phase changes) rather than a JS animation library.
export function OnboardingFadeIn({ children, className, delay }: Props) {
  return (
    <div
      className={clsx(
        "motion-reduce:animate-none animate-onboarding-rise",
        className,
      )}
      style={{ animationDelay: delay ? `${delay}ms` : undefined }}
    >
      {children}
    </div>
  )
}
