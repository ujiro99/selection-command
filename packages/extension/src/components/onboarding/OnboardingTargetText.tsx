import { useRef, useState } from "react"
import { MousePointerClick, TextCursor } from "lucide-react"
import { t } from "@/services/i18n"
import { cn, isEmpty } from "@/lib/utils"
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion"
import { useSelectContext } from "@/hooks/useSelectContext"
import { useSelectionDemo } from "./useSelectionDemo"
import { OnboardingCallout } from "./OnboardingCallout"
import { splitTargetWord } from "./textUtils"
import type { OnboardingSelectGesture } from "./onboardingVariantUi"

type Props = {
  text: string
  // True once the user has actually selected the text (any later phase),
  // rendering it as a static, already-selected highlight instead.
  selected: boolean
  // Delay (ms) before the "select this" callout appears. Passed in rather
  // than hardcoded so callers manage it alongside their other phase-based
  // delays (see each step's `delays` object).
  calloutDelay?: number
  // Gesture to ask for. "doubleClick" needs `targetWord` to be part of
  // `text`; it is the word that gets marked and demonstrated.
  gesture?: OnboardingSelectGesture
  targetWord?: string
  // Called on every press on the card, before any selection happens, so
  // callers can tell "never touched the card" apart from "tried to select
  // and failed".
  onInteract?: () => void
}

// The sample text card shown on Steps 1-2. Demonstrates the requested
// gesture on a loop - a drag across the whole text via useSelectionDemo(),
// or a double-click on one marked word - and points an OnboardingCallout at
// the card while nothing is selected, matching every other "do this next"
// hint in the onboarding flow (see OnboardingCallout) so first-time users
// recognize this as something to select rather than something to read.
export function OnboardingTargetText({
  text,
  selected,
  calloutDelay,
  gesture = "drag",
  targetWord,
  onInteract,
}: Props) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const { selectionText } = useSelectContext()
  const textRef = useRef<HTMLSpanElement>(null)
  const cursorRef = useRef<HTMLSpanElement>(null)
  const [cardElm, setCardElm] = useState<HTMLDivElement | null>(null)
  // Nothing currently selected -> still prompting the user to select the
  // sample text. Tracks live selection (not the latched `selected` prop) so
  // the hint and demo both reappear if the user deselects without running
  // a command yet.
  const showSelectHint = isEmpty(selectionText)
  const runDemo = !prefersReducedMotion && showSelectHint

  const parts =
    gesture === "doubleClick" ? splitTargetWord(text, targetWord) : null
  const isDoubleClick = parts != null

  useSelectionDemo(textRef, cursorRef, runDemo && !isDoubleClick)

  return (
    <div className="flex flex-col items-center gap-2.5">
      <div
        ref={setCardElm}
        onPointerDown={onInteract}
        data-testid="onboarding-target-card"
        className={cn(
          "relative max-w-[560px] rounded-lg border px-[26px] py-5 text-left text-base leading-[1.9] text-slate-800 dark:text-slate-200 select-text",
          "border-slate-200 dark:border-slate-800 bg-muted/80",
          !selected &&
            !runDemo &&
            "[--onboarding-ring-color:rgba(8,47,73,0.16)] animate-onboarding-ring motion-reduce:animate-none",
        )}
      >
        {isDoubleClick ? (
          <span className="p-1">
            {parts.before}
            <span
              data-testid="onboarding-target-word"
              className={cn(
                "relative rounded-sm underline decoration-sky-700/60 decoration-2 underline-offset-4 dark:decoration-sky-400/70",
                runDemo &&
                  "animate-onboarding-dblclick-word dark:[--onboarding-highlight-color:var(--color-sky-800)]",
              )}
            >
              {parts.word}
              {runDemo && <DoubleClickDemo />}
            </span>
            {parts.after}
          </span>
        ) : (
          <>
            <span
              ref={textRef}
              className={cn(
                "[box-decoration-break:clone] p-1",
                // `runDemo` is already false when prefers-reduced-motion is
                // on (see usePrefersReducedMotion() above), so no
                // motion-reduce: variant is needed here.
                runDemo &&
                  "animate-onboarding-highlight rounded-sm dark:[--onboarding-highlight-color:var(--color-sky-800)]",
              )}
            >
              {text}
            </span>

            {runDemo && (
              <span
                ref={cursorRef}
                aria-hidden
                className="pointer-events-none absolute top-0 left-0 select-none text-slate-900 dark:text-slate-100 opacity-0 filter-[drop-shadow(0_0_2px_#fff)_drop-shadow(0_1px_3px_rgba(15,23,42,.35))]"
              >
                <TextCursor className="size-[18px]" strokeWidth={2} />
              </span>
            )}
          </>
        )}
      </div>

      <OnboardingCallout
        targetElm={cardElm}
        open={showSelectHint}
        openDelay={calloutDelay}
      >
        <span className="inline-flex items-center gap-1.5">
          {isDoubleClick ? (
            <MousePointerClick className="size-3.5" strokeWidth={2} />
          ) : (
            <TextCursor className="size-3.5" strokeWidth={2} />
          )}
          {isDoubleClick
            ? t("onboarding_doubleClickHint")
            : t("onboarding_selectHint")}
        </span>
      </OnboardingCallout>
    </div>
  )
}

// Loops "the cursor moves onto the word, clicks twice, the word highlights"
// over the marked word. Anchored to the word's center by its positioned
// parent, so it needs no measuring; the three CSS animations share one
// duration (see global.css) so they stay in step. Holds no text and ignores
// the pointer, so it never takes part in the user's own selection.
function DoubleClickDemo() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute top-1/2 left-1/2 select-none"
    >
      <span className="absolute -top-3 -left-3 size-6 rounded-full bg-sky-600/50 dark:bg-sky-400/50 opacity-0 animate-onboarding-dblclick-ripple" />
      <span className="absolute -top-[9px] -left-[9px] text-slate-900 dark:text-slate-100 opacity-0 animate-onboarding-dblclick-cursor filter-[drop-shadow(0_0_2px_#fff)_drop-shadow(0_1px_3px_rgba(15,23,42,.35))]">
        <TextCursor className="size-[18px]" strokeWidth={2} />
      </span>
    </span>
  )
}
