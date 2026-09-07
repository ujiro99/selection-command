import { useEffect, useRef } from "react"
import confetti from "canvas-confetti"
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion"

const COLORS = [
  "#082f49",
  "#0284c7",
  "#7dd3fc",
  "#f59e0b",
  "#cbd5e1",
  "#dc2626",
  "#ef4444",
]

// Step5's one-shot celebration burst. Fires once on mount and never loops -
// see the onboarding motion spec's "one thing moves at a time" rule; a
// looping confetti field would compete with the checkmark/heading fade-in.
//
// `useWorker: false` is required under the extension pages' MV3 CSP
// (script-src 'self'): canvas-confetti defaults to rendering in a blob-URL
// web worker, which that CSP blocks.
//
// Gating is done with our own usePrefersReducedMotion() rather than
// canvas-confetti's built-in `disableForReducedMotion` option: that option
// checks `matchMedia('(prefers-reduced-motion)')` with no value, which
// matches whenever the browser merely *supports* the media feature - true
// in effectively every modern browser - so it silently disables confetti
// unconditionally rather than honoring the user's actual OS setting.
export function OnboardingConfetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || prefersReducedMotion) return

    const instance = confetti.create(canvas, {
      resize: true,
      useWorker: false,
    })

    // Delay the burst slightly so it doesn't fire before the page has
    // finished painting (avoids the first frames being dropped/invisible).
    const timer = setTimeout(() => {
      // angle: 270 shoots particles downward (canvas-confetti's angle 90,
      // the default, shoots UP - a fountain/firework burst - which combined
      // with origin.y near/above 0 sends everything off the top of the
      // canvas and it never becomes visible). origin.y: 0 starts them right
      // at the top edge so the fall reads immediately.
      //
      // ticks: 200 keeps particles alive long enough to reach the bottom
      // of the viewport instead of being culled mid-fall.
      instance({
        particleCount: 120,
        spread: 160,
        angle: 270,
        startVelocity: 35,
        gravity: 0.8,
        ticks: 200,
        origin: { x: 0.5, y: 0 },
        colors: COLORS,
      })
    }, 600)

    return () => {
      clearTimeout(timer)
      instance.reset()
    }
  }, [prefersReducedMotion])

  if (prefersReducedMotion) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      // `w-full h-full` are load-bearing, not decorative: <canvas> is a
      // replaced element, so `inset-0` alone leaves its CSS box at the
      // element's intrinsic 300x150 default (absolutely-positioned replaced
      // elements size from their intrinsic dimensions, not from inset
      // constraints, per CSS2.1 10.6.5) - canvas-confetti's `resize: true`
      // then reads that tiny box via getBoundingClientRect() and everything
      // renders squeezed into the top-left corner.
      className="pointer-events-none fixed inset-0 z-20 size-full !h-full"
    />
  )
}
