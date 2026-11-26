import { useState, useCallback, type SyntheticEvent } from "react"

/**
 * Attribute put on a popup content while the hover background of its items
 * must not be shown. Items use it as `not-in-data-[hover-blocked]:`.
 */
export const HOVER_BLOCKED_ATTR = "data-hover-blocked"

/**
 * Gates the hover background of the items inside a popup content.
 *
 * The hover background is blocked:
 * - while the content itself runs its enter / exit animation, so the items
 *   moving under a still or moving cursor do not flicker.
 * - after the animation, until the pointer actually moves over the content,
 *   so an item that just stopped under the cursor does not light up suddenly.
 *
 * The animation is tracked by the animation events of the content element
 * instead of timers, so the gate follows the real animation even when it
 * starts late (Radix starts it only after the content is positioned).
 *
 * A content unmounted in the middle of its animation may miss the end
 * event, but the next enter animation starts the gate over again.
 *
 * Spread the returned props on the content element.
 */
export function useHoverGate() {
  const [animating, setAnimating] = useState(false)
  const [moved, setMoved] = useState(false)

  // Animation events bubble: ignore the ones of descendants such as icons
  // or nested popup contents.
  const isSelf = (e: SyntheticEvent) => e.target === e.currentTarget

  const onAnimationStart = useCallback((e: SyntheticEvent) => {
    if (!isSelf(e)) return
    setAnimating(true)
    setMoved(false)
  }, [])

  const onAnimationEnd = useCallback((e: SyntheticEvent) => {
    if (!isSelf(e)) return
    setAnimating(false)
  }, [])

  const onPointerMove = useCallback(() => {
    if (animating) return
    setMoved(true)
  }, [animating])

  const blocked = animating || !moved

  return {
    [HOVER_BLOCKED_ATTR]: blocked ? "" : undefined,
    onAnimationStart,
    onAnimationEnd,
    onPointerMove,
  }
}
