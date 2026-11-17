"use client"

import { useLayoutEffect, useRef, type ReactNode } from "react"

/**
 * Scales its content down when it is wider than `maxWidth`, so translated
 * copy keeps the slide layout. It uses `zoom`, which shrinks the layout box
 * too, so the parts stacked below move up with it instead of leaving a gap.
 */
export function Fit({
  maxWidth,
  align = "left",
  children,
}: {
  maxWidth: number
  align?: "left" | "center"
  children: ReactNode
}): JSX.Element {
  const ref = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => {
      // Measure the natural width without the previous zoom
      el.style.zoom = ""
      const width = el.offsetWidth
      el.style.zoom = width > maxWidth ? String(maxWidth / width) : ""
    }
    fit()
    // Measure again once web fonts are in
    document.fonts?.ready.then(fit)
  })

  return (
    <span
      ref={ref}
      style={{
        display: align === "center" ? "block" : "inline-block",
        width: align === "center" ? "max-content" : undefined,
        marginInline: align === "center" ? "auto" : undefined,
      }}
    >
      {children}
    </span>
  )
}
