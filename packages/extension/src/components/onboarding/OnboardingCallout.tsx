import { ReactNode, useEffect, useState } from "react"
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
  PopoverArrow,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { SIDE, ALIGN } from "@/const"

type Props = {
  // The element the callout should point at (e.g. a specific command button
  // found via `[data-command-id]`, see MenuItem.tsx).
  targetElm: Element | null
  open: boolean
  // Delay (ms) before the callout actually appears once `open` becomes
  // true, so it doesn't flash in immediately alongside the thing it's
  // pointing at. Hiding (`open` -> false) is always immediate.
  openDelay?: number
  // Extra classes merged onto the popover content, e.g. to override the
  // default enter-animation duration for a specific caller.
  contentClassName?: string
  side?: SIDE
  align?: ALIGN
  children: ReactNode
}

// A speech-bubble style callout anchored to an arbitrary DOM element,
// externally controlled via `open` (unlike Tooltip.tsx, which is
// hover-triggered and used throughout the regular popup menu - reusing it
// here would risk regressing that shared, frequently-exercised component).
export function OnboardingCallout({
  targetElm,
  open,
  openDelay = 0,
  contentClassName,
  side = SIDE.top,
  align = ALIGN.center,
  children,
}: Props) {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (!open) {
      setShown(false)
      return
    }
    if (openDelay <= 0) {
      setShown(true)
      return
    }
    const timer = window.setTimeout(() => setShown(true), openDelay)
    return () => window.clearTimeout(timer)
  }, [open, openDelay])

  if (!targetElm) return null

  return (
    <Popover open={shown}>
      <PopoverAnchor virtualRef={{ current: targetElm }} />
      {shown && (
        <PopoverContent
          side={side}
          align={align}
          sideOffset={10}
          className={cn(contentClassName, "shadow-none")}
        >
          <div className="animate-onboarding-float motion-reduce:animate-none max-w-64 rounded-md bg-gray-800 px-3 py-2 shadow-xl">
            <p className="text-sm text-white whitespace-pre-wrap">{children}</p>
          </div>
          <PopoverArrow
            className="fill-gray-800 animate-onboarding-float motion-reduce:animate-none shadow-xl"
            height={6}
          />
        </PopoverContent>
      )}
    </Popover>
  )
}
