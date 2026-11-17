"use client"

import { useLayoutEffect, useRef, type ReactNode } from "react"

/**
 * Scales its content down when it is wider than `maxWidth`, so translated
 * copy keeps the slide layout. The scale does not change the layout box, so
 * the parts below stay where they are.
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
      // offsetWidth ignores transforms, so it is the natural width
      const width = el.offsetWidth
      el.style.transform = width > maxWidth ? `scale(${maxWidth / width})` : ""
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
        position: align === "center" ? "relative" : undefined,
        left: align === "center" ? "50%" : undefined,
        translate: align === "center" ? "-50% 0" : undefined,
        transformOrigin: align === "center" ? "50% 0" : "0 0",
      }}
    >
      {children}
    </span>
  )
}
