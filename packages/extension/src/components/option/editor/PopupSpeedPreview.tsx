import { useEffect, useState, type CSSProperties } from "react"
import { MousePointer2 } from "lucide-react"

import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion"
import type { PopupSpeedValues } from "@/services/option/popupSpeed"
import { cn } from "@/lib/utils"

import css from "./PopupSpeedPreview.module.css"

// The menu is held for a constant time after it has fully appeared:
//   preview time = delay + duration + HOLD_MS
const HOLD_MS = 500
// Constant interval between previews (the selection stays cleared).
const GAP_MS = 500

type Props = {
  values: PopupSpeedValues
}

const toMs = (value: number) => (Number.isFinite(value) ? value : 0)

type ProgressSegmentProps = {
  // Relative width of the segment (its time in ms).
  weight: number
  fillClassName: string
  // The fill is shown only while the selection is shown.
  visible: boolean
  // Remounts the fill on every loop so its CSS animation restarts.
  cycle: number
}

const ProgressSegment = ({
  weight,
  fillClassName,
  visible,
  cycle,
}: ProgressSegmentProps) => {
  if (weight <= 0) return null
  return (
    <span
      // Track color matches the bar background in StorageUsage.
      className="block h-full basis-0 overflow-hidden bg-gray-100 dark:bg-gray-800"
      style={{ flexGrow: weight }}
    >
      {visible && (
        <span key={cycle} className={cn("block h-full", fillClassName)} />
      )}
    </span>
  )
}

/**
 * A pure HTML + CSS mock of "select text -> menu appears" used to preview
 * the menu display speed. It loops the animation with the given values.
 */
export const PopupSpeedPreview = ({ values }: Props) => {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [cycle, setCycle] = useState(0)
  const [selected, setSelected] = useState(true)

  const playing = !prefersReducedMotion
  const delay = toMs(values.popupDelay)
  const duration = toMs(values.popupDuration)

  useEffect(() => {
    if (!playing) {
      setSelected(true)
      return
    }
    // Loop: show the selection (the menu animates in via CSS), hold, then
    // clear the selection for a moment and start over.
    let timer: number
    const start = () => {
      setSelected(true)
      setCycle((c) => c + 1)
      timer = window.setTimeout(
        () => {
          setSelected(false)
          timer = window.setTimeout(start, GAP_MS)
        },
        delay + duration + HOLD_MS,
      )
    }
    start()
    return () => window.clearTimeout(timer)
  }, [playing, delay, duration])

  const style = {
    "--preview-delay": `${delay}ms`,
    "--preview-duration": `${duration}ms`,
  } as CSSProperties

  return (
    <div
      className="relative h-auto w-full px-5 pt-10 rounded-md border border-input bg-background overflow-hidden"
      style={style}
      aria-hidden="true"
      data-testid="popup-speed-preview"
    >
      <p className="text-xs text-muted-foreground leading-5 whitespace-nowrap select-none">
        Lorem{" "}
        {/* The pointer and the menu are anchored to the end of the selection. */}
        <span className="relative">
          <span className={cn("px-0.5 py-px", selected && css.selection)}>
            ipsum dolor
          </span>
          {selected && (
            <span
              key={cycle}
              className={cn(
                "absolute left-0 top-full mt-3 flex gap-1.5 rounded-md border border-input bg-white dark:bg-gray-800 p-1.5 shadow-md",
                playing && css.menu,
              )}
            >
              <span className="h-4 w-20 rounded-sm bg-gray-200 dark:bg-gray-600" />
            </span>
          )}
          {/* The pointer appears together with the selection highlight. */}
          {selected && (
            <MousePointer2
              size={18}
              className="absolute -right-2.5 top-2.5 z-10 fill-white text-gray-800 dark:fill-gray-900 dark:text-gray-100"
            />
          )}
        </span>{" "}
        sit amet.
      </p>
      {/*
       * Display-only progress bar along the bottom edge of the stage. It is
       * split into a delay segment and a duration segment, each sized by its
       * share of the total time and told apart by color.
       */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex h-1 gap-px"
        data-testid="popup-speed-preview-progress"
      >
        {/* Colors match "System" and "Commands" in StorageUsage. */}
        <ProgressSegment
          weight={delay}
          fillClassName={cn(
            "bg-gray-600 dark:bg-gray-300",
            playing && css.progressDelay,
          )}
          visible={selected}
          cycle={cycle}
        />
        <ProgressSegment
          weight={duration}
          fillClassName={cn(
            "bg-gray-300 dark:bg-gray-500",
            playing && css.progressDuration,
          )}
          visible={selected}
          cycle={cycle}
        />
      </div>
    </div>
  )
}
