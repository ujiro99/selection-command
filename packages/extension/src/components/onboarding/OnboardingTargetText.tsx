import { useRef, useState } from "react"
import { TextCursor } from "lucide-react"
import { t } from "@/services/i18n"
import { cn, isEmpty } from "@/lib/utils"
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion"
import { useSelectContext } from "@/hooks/useSelectContext"
import { useSelectionDemo } from "./useSelectionDemo"
import { OnboardingCallout } from "./OnboardingCallout"

type Props = {
  text: string
  // True once the user has actually selected the text (any later phase),
  // rendering it as a static, already-selected highlight instead.
  selected: boolean
}

// The sample text card shown on Steps 1-2. Demonstrates the "drag to
// select" gesture on a loop via useSelectionDemo(), and points an
// OnboardingCallout at the card while nothing is selected - matching every
// other "do this next" hint in the onboarding flow (see OnboardingCallout)
// so first-time users recognize this as something to select rather than
// something to read.
export function OnboardingTargetText({ text, selected }: Props) {
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

  useSelectionDemo(textRef, cursorRef, runDemo)

  return (
    <div className="flex flex-col items-center gap-2.5">
      <div
        ref={setCardElm}
        className={cn(
          "relative max-w-[560px] rounded-lg border px-[26px] py-5 text-left text-base leading-[1.9] text-slate-800 select-text",
          "border-slate-200 bg-muted/80",
          !selected &&
            !runDemo &&
            "[--onboarding-ring-color:rgba(8,47,73,0.16)] animate-onboarding-ring motion-reduce:animate-none",
        )}
      >
        <span
          ref={textRef}
          className={cn(
            "[box-decoration-break:clone] p-1",
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

      <OnboardingCallout
        targetElm={cardElm}
        open={showSelectHint}
        openDelay={800}
      >
        <span className="inline-flex items-center gap-1.5">
          <TextCursor className="size-3.5" strokeWidth={2} />
          {t("onboarding_selectHint")}
        </span>
      </OnboardingCallout>
    </div>
  )
}
