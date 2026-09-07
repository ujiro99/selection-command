import { RefObject, useEffect, useRef } from "react"

// A visual-line rect in the coordinate space needed to build keyframes.
// Deliberately a plain object (not DOMRect) so buildKeyframes() is testable
// without a DOM.
export type LineRect = { x: number; y: number; width: number; height: number }

const LINE_MOVE_MS = 900
const TAIL_HOLD_MS = 1200
// Fraction of the total animation spent hidden while jumping between two
// lines - long enough to fully hide the jump, short enough to stay
// unnoticed as a "flicker" rather than a pause.
const GAP_FRACTION = 0.015

function clampOffset(offset: number): number {
  return Math.min(1, Math.max(0, Number(offset.toFixed(4))))
}

// Builds Web Animations API keyframes that walk an absolutely-positioned
// cursor element left-to-right along each visual line in `lines` (both
// `lines` and `host` are in the same coordinate space, typically viewport
// coordinates from getBoundingClientRect/getClientRects - the caller
// subtracts nothing, this function does), hiding the jump between lines
// behind a brief opacity dip so it reads as "the cursor left the page and
// re-entered at the next line" rather than a teleport.
//
// Exported for direct unit testing - this is where the actual geometry
// logic lives; the hook around it is mostly measurement plumbing.
export function buildKeyframes(lines: LineRect[], host: LineRect): Keyframe[] {
  if (lines.length === 0) return []

  const sumWidth = lines.reduce((sum, l) => sum + l.width, 0) || 1
  const gapCount = lines.length - 1
  const gapFraction = gapCount > 0 ? GAP_FRACTION : 0
  const totalMoveMs = LINE_MOVE_MS * lines.length
  const holdFraction = TAIL_HOLD_MS / (totalMoveMs + TAIL_HOLD_MS)
  // Remaining budget after the gaps and the tail hold, distributed across
  // lines proportional to their width so a long line takes longer to
  // traverse than a short one.
  const moveFraction = 1 - holdFraction - gapFraction * gapCount

  const frames: Keyframe[] = []
  let offset = 0
  let lastTransform = ""

  lines.forEach((line, i) => {
    const startX = line.x - host.x
    const endX = line.x + line.width - host.x
    const y = line.y - host.y
    const endTransform = `translate(${endX}px, ${y}px)`

    if (frames.length === 0) {
      frames.push({
        offset: 0,
        transform: `translate(${startX}px, ${y}px)`,
        opacity: 1,
      })
    }

    offset += moveFraction * (line.width / sumWidth)
    frames.push({
      offset: clampOffset(offset),
      transform: endTransform,
      opacity: 1,
    })
    lastTransform = endTransform

    const next = lines[i + 1]
    if (next) {
      const nextStart = `translate(${next.x - host.x}px, ${next.y - host.y}px)`
      offset += gapFraction / 2
      frames.push({
        offset: clampOffset(offset),
        transform: endTransform,
        opacity: 0,
      })
      offset += gapFraction / 2
      frames.push({
        offset: clampOffset(offset),
        transform: nextStart,
        opacity: 0,
      })
      frames.push({
        offset: clampOffset(offset),
        transform: nextStart,
        opacity: 1,
      })
      lastTransform = nextStart
    }
  })

  frames.push({ offset: 1, transform: lastTransform, opacity: 1 })
  return frames
}

function rectSignature(rects: DOMRect[]): string {
  return rects.map((r) => `${r.x | 0},${r.y | 0},${r.width | 0}`).join("|")
}

// Demonstrates "drag to select" on a loop by measuring the rendered lines of
// `textRef`'s content at runtime (via Range.getClientRects()) and animating
// `cursorRef` - an absolutely-positioned I-beam glyph, a sibling of the
// text, not a child - along them. Runtime measurement (rather than
// hardcoded pixel keyframes) is what makes this locale-proof: every one of
// the extension's 14 locales wraps this string differently, and the card is
// responsive.
//
// `cursorRef`'s nearest positioned ancestor (`offsetParent`) is used as the
// coordinate host, so the caller must give the card itself (or a wrapper
// around both the text and the cursor) `position: relative`.
export function useSelectionDemo(
  textRef: RefObject<HTMLElement | null>,
  cursorRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  const signatureRef = useRef("")
  const animationRef = useRef<Animation | null>(null)

  useEffect(() => {
    const text = textRef.current
    const cursor = cursorRef.current
    // `cursor.animate` is absent in jsdom (no test environment implements
    // WAAPI), which is exactly the no-op we want in tests - no separate
    // "are we in a test" branch needed.
    if (!enabled || !text || !cursor || typeof cursor.animate !== "function") {
      return
    }

    let cancelled = false

    const measure = () => {
      if (cancelled) return
      const host = cursor.offsetParent as HTMLElement | null
      if (!host) return

      const range = document.createRange()
      range.selectNodeContents(text)
      const rects = Array.from(range.getClientRects()).filter(
        (r) => r.width > 0.5 && r.height > 0.5,
      )
      // Empty when the card is hidden or not laid out yet. No-op and wait
      // for the ResizeObserver below to fire once a box appears - don't
      // cancel any animation already running from a prior measurement.
      if (rects.length === 0) return

      const signature = rectSignature(rects)
      if (signature === signatureRef.current && animationRef.current) return
      signatureRef.current = signature

      const hostRect = host.getBoundingClientRect()
      const keyframes = buildKeyframes(rects, hostRect)
      if (keyframes.length === 0) return

      animationRef.current?.cancel()
      animationRef.current = cursor.animate(keyframes, {
        duration: LINE_MOVE_MS * rects.length + TAIL_HOLD_MS,
        iterations: Infinity,
        easing: "linear",
      })
    }

    const scheduleMeasure = () => {
      requestAnimationFrame(measure)
    }

    // Observe the card (the text's parent), not the cursor itself - the
    // cursor is `position: absolute; pointer-events: none`, so it can never
    // affect the card's box and therefore can't create a resize-observer
    // feedback loop.
    const ro = new ResizeObserver(scheduleMeasure)
    ro.observe(text.parentElement ?? text)

    measure()
    // Re-measure once webfonts finish loading - a late font swap can change
    // line-wrap points after the first measurement.
    document.fonts?.ready?.then(scheduleMeasure)

    return () => {
      cancelled = true
      ro.disconnect()
      animationRef.current?.cancel()
      animationRef.current = null
      signatureRef.current = ""
    }
  }, [enabled, textRef, cursorRef])
}
