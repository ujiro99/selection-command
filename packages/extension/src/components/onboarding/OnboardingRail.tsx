import { Check, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

// Reinforces the PRD's "select -> command -> result" mental model
// (https://github.com/ujiro99/selection-command/issues/452, section 6-2) as
// a persistent visual on Steps 1-3, replacing the plain uppercase caption
// text from the first cut. `activeBeat` is the 0-based index of the beat
// the current step is on (0 = selecting, 1 = running a command, 2 = seeing
// the result); beats before it render as done, after it as upcoming.
// Passing -1 renders all three beats as done, for the value-shown payoff
// screens where all three actions already happened.
type Props = {
  selectLabel: string
  commandLabel: string
  resultLabel: string
  activeBeat: 0 | 1 | 2 | -1
  // "sm" (default) is the compact form shown inline while a step is in
  // progress; "lg" is the larger, staggered-reveal form used on the
  // value-shown payoff screens.
  size?: "sm" | "lg"
}

type BeatState = "done" | "current" | "todo"

function beatState(index: number, activeBeat: Props["activeBeat"]): BeatState {
  if (activeBeat === -1 || index < activeBeat) return "done"
  return index === activeBeat ? "current" : "todo"
}

export function OnboardingRail({
  selectLabel,
  commandLabel,
  resultLabel,
  activeBeat,
  size = "sm",
}: Props) {
  const beats = [selectLabel, commandLabel, resultLabel]
  const lg = size === "lg"

  return (
    <div
      className={cn(
        "flex items-center",
        lg
          ? "gap-3 rounded-lg border border-slate-200 bg-slate-50 px-[26px] py-4"
          : "gap-2.5",
      )}
    >
      {beats.map((label, i) => {
        const state = beatState(i, activeBeat)
        // The chevron before beat i is "walked" once the beat to its left
        // (i - 1) is done.
        const chevronWalked = i > 0 && beatState(i - 1, activeBeat) === "done"
        // Each beat/chevron fades in a beat later than the last, so the
        // sequence reads left-to-right - only used for the "lg" celebratory
        // rail; the compact "sm" rail appears with the step's own fade-in.
        const delayMs = lg ? 60 + i * 140 : 0

        return (
          <div key={label} className="contents">
            {i > 0 && (
              <ChevronRight
                className={cn(
                  lg ? "size-[15px]" : "size-3",
                  chevronWalked ? "text-[#082f49]" : "text-slate-300",
                  lg && "animate-onboarding-rise motion-reduce:animate-none",
                )}
                style={lg ? { animationDelay: `${delayMs}ms` } : undefined}
                strokeWidth={3.2}
              />
            )}
            <div
              className={cn(
                "flex items-center font-semibold tracking-wide text-slate-500",
                lg ? "gap-2.5 text-[13px]" : "gap-1.5 text-xs",
                lg && "animate-onboarding-rise motion-reduce:animate-none",
              )}
              style={lg ? { animationDelay: `${delayMs}ms` } : undefined}
            >
              <span
                className={cn(
                  "flex items-center justify-center rounded-full",
                  lg ? "size-6" : "size-[18px]",
                  state === "todo"
                    ? "bg-slate-200"
                    : "bg-[#082f49]/[0.14] text-[#082f49]",
                )}
              >
                {state === "done" && (
                  <Check
                    className={lg ? "size-3" : "size-2.5"}
                    strokeWidth={3.2}
                  />
                )}
                {state === "current" && (
                  <span className="size-1.5 rounded-full bg-[#082f49]" />
                )}
              </span>
              <span className={state === "todo" ? "" : "text-[#082f49]"}>
                {label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
