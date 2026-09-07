import { useEffect, useState } from "react"

const QUERY = "(prefers-reduced-motion: reduce)"

// Tracks the OS-level "reduce motion" preference. Tailwind's `motion-reduce:`
// variant already handles CSS-only animations, but JS-driven effects (the
// selection demo's Web Animations API keyframes, the confetti burst) need
// this to decide whether to run at all.
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia(QUERY).matches,
  )

  useEffect(() => {
    const mql = window.matchMedia(QUERY)
    const onChange = () => setPrefersReduced(mql.matches)

    if (mql.addEventListener) {
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    }
    // Safari < 14 fallback.
    mql.addListener(onChange)
    return () => mql.removeListener(onChange)
  }, [])

  return prefersReduced
}
