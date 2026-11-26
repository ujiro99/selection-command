import { Source_Code_Pro } from "next/font/google"
import { MousePointer } from "lucide-react"

import css from "./Logo.module.css"

// Ported from selection-command-hub (src/components/hub/logo.tsx).
const logoFont = Source_Code_Pro({
  subsets: ["latin"],
  weight: ["300", "600"],
  // Until the web font arrives, use a system monospace font: its glyph widths
  // already match, so the logo does not flash oversized.
  adjustFontFallback: false,
  fallback: [
    "ui-monospace",
    "SFMono-Regular",
    "Menlo",
    "Consolas",
    "monospace",
  ],
})

const variantClass = {
  default: css.default,
  sm: css.sm,
  lg: css.lg,
  xl: css.xl,
  "2xl": css.xxl,
} as const

type Variant = keyof typeof variantClass

interface Props {
  variant?: Variant
  hub?: boolean
  /** Use on dark or saturated backgrounds, with white text */
  onDark?: boolean
  className?: string
}

/** The "Selection Command" wordmark with a pointer over "Command". */
export function Logo({
  variant = "default",
  hub = true,
  onDark = false,
  className,
}: Props) {
  const classNames = [
    logoFont.className,
    css.logo,
    variantClass[variant],
    onDark && css.onDark,
    className,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <span className={classNames}>
      {/* The spaces keep the text "Selection Command Hub" readable for screen
          readers and crawlers; flex layout drops them, so the gap sets the
          visual spacing. */}
      <span className={css.selection}>Selection</span>{" "}
      <span className={css.command}>
        Command
        <MousePointer className={css.pointer} />
      </span>
      {hub && (
        <>
          {" "}
          <span className={css.hub}>Hub</span>
        </>
      )}
    </span>
  )
}
