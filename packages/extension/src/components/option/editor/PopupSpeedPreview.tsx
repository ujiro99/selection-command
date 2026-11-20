import { useEffect, useState, type CSSProperties } from "react"
import { MousePointer2 } from "lucide-react"

import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion"
import type { PopupSpeedValues } from "@/services/option/popupSpeed"
import { cn } from "@/lib/utils"

import css from "./PopupSpeedPreview.module.css"

// The time one preview is shown scales with the speed, so a faster speed
// shows more popups per unit of time:
//   preview time = (delay + duration) * PREVIEW_SCALE + PREVIEW_BASE_MS
const PREVIEW_SCALE = 3
const PREVIEW_BASE_MS = 300
// Constant interval between previews (the selection stays cleared).
const GAP_MS = 500

type Props = {
  values: PopupSpeedValues
}

const toMs = (value: number) => (Number.isFinite(value) ? value : 0)

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
        (delay + duration) * PREVIEW_SCALE + PREVIEW_BASE_MS,
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
      className="relative h-full min-h-[120px] w-full rounded-md border border-input bg-white dark:bg-gray-900 px-3 pt-3 overflow-hidden"
      style={style}
      aria-hidden="true"
      data-testid="popup-speed-preview"
    >
      <p className="text-xs text-muted-foreground leading-5 whitespace-nowrap select-none">
        Lorem{" "}
        {/* The pointer and the menu are anchored to the end of the selection. */}
        <span className="relative">
          <span className={cn(selected && css.selection)}>ipsum dolor</span>
          {selected && (
            <span
              key={cycle}
              className={cn(
                "absolute left-0 top-full mt-2 flex gap-1.5 rounded-md border border-input bg-white dark:bg-gray-800 p-1.5 shadow-md",
                playing && css.menu,
              )}
            >
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="size-4 rounded-sm bg-gray-300 dark:bg-gray-600"
                />
              ))}
            </span>
          )}
          <MousePointer2
            size={18}
            className="absolute -right-2.5 top-2.5 z-10 fill-white text-gray-800 dark:fill-gray-900 dark:text-gray-100"
          />
        </span>{" "}
        sit amet.
      </p>
    </div>
  )
}
