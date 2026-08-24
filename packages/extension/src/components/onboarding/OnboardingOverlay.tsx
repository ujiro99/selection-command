import { useEffect, useState, RefObject } from "react"
import css from "./Onboarding.module.css"

type Props = {
  // The element to highlight. When null/undefined, nothing is rendered.
  targetRef: RefObject<Element | null> | null
}

// Dims the rest of the page and slowly pulses an outline around the target
// element, per the PRD's "背景を少し暗くする / ゆっくり明滅させる" rule for
// the text/link the user is meant to select next.
export function OnboardingOverlay({ targetRef }: Props) {
  const [rect, setRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    const target = targetRef?.current
    if (!target) {
      setRect(null)
      return
    }

    const update = () => setRect(target.getBoundingClientRect())
    update()

    // Layout can shift from page content loading/reflowing; a lightweight
    // poll is simpler and safer here than a ResizeObserver + MutationObserver
    // combo for a short-lived onboarding overlay.
    const interval = window.setInterval(update, 300)
    window.addEventListener("scroll", update, true)
    window.addEventListener("resize", update)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener("scroll", update, true)
      window.removeEventListener("resize", update)
    }
  }, [targetRef])

  if (!rect) return null

  return (
    <div
      className={css.spotlight}
      style={{
        position: "fixed",
        top: rect.top - 6,
        left: rect.left - 6,
        width: rect.width + 12,
        height: rect.height + 12,
        pointerEvents: "none",
        zIndex: 2147483000,
      }}
    />
  )
}
