import { useRef } from "react"
import { TextCursor } from "lucide-react"
import { t } from "@/services/i18n"
import { cn } from "@/lib/utils"
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion"
import { useSelectionDemo } from "./useSelectionDemo"

type Props = {
  text: string
  // True only pre-selection, while the step is still explaining what to do
  // (StepPhase.EXPLAIN with no real selection yet) - drives both the
  // "drag to select" caption and the animated demo.
  demoActive: boolean
  // True once the user has actually selected the text (any later phase),
  // rendering it as a static, already-selected highlight instead.
  selected: boolean
}

// The sample text card shown on Steps 1-2. Demonstrates the "drag to
// select" gesture on a loop via useSelectionDemo() so first-time users
// recognize this as something to select rather than something to read -
// see onboarding_selectHint and the animated highlight/cursor below.
export function OnboardingTargetText({ text, demoActive, selected }: Props) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const textRef = useRef<HTMLSpanElement>(null)
  const cursorRef = useRef<HTMLSpanElement>(null)
  const runDemo = demoActive && !prefersReducedMotion

  useSelectionDemo(textRef, cursorRef, runDemo)

  return (
    <div className="flex flex-col items-center gap-2.5">
      {demoActive && (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wide text-slate-500">
          <TextCursor className="size-3.5" strokeWidth={2} />
          {t("onboarding_selectHint")}
        </span>
      )}

      <div
        className={cn(
          "relative max-w-[560px] rounded-lg border px-[26px] py-5 text-left text-base leading-[1.9] text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,.04),0_14px_30px_-20px_rgba(15,23,42,.3)]",
          selected ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white",
          !selected &&
            !runDemo &&
            "[--onboarding-ring-color:rgba(8,47,73,0.16)] animate-onboarding-ring motion-reduce:animate-none",
        )}
      >
        <span
          ref={textRef}
          className={cn(
            "[box-decoration-break:clone]",
            selected && "rounded-sm bg-blue-200",
            // `runDemo` is already false when prefers-reduced-motion is on
            // (see usePrefersReducedMotion() above), so no motion-reduce:
            // variant is needed here.
            runDemo && "animate-onboarding-highlight rounded-sm",
          )}
        >
          {text}
        </span>

        {runDemo && (
          <span
            ref={cursorRef}
            aria-hidden
            className="pointer-events-none absolute top-0 left-0 select-none text-slate-900 opacity-0 [filter:drop-shadow(0_0_2px_#fff)_drop-shadow(0_1px_3px_rgba(15,23,42,.35))]"
          >
            <TextCursor className="size-[18px]" strokeWidth={2} />
          </span>
        )}
      </div>
    </div>
  )
}
