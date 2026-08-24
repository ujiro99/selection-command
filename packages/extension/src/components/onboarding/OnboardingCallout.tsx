import { ReactNode } from "react"
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
  PopoverArrow,
} from "@/components/ui/popover"
import { SIDE, ALIGN } from "@/const"

type Props = {
  // The element the callout should point at (e.g. a specific command button
  // found via `[data-command-id]`, see MenuItem.tsx).
  targetElm: Element | null
  open: boolean
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
  side = SIDE.bottom,
  align = ALIGN.center,
  children,
}: Props) {
  if (!targetElm) return null

  return (
    <Popover open={open}>
      <PopoverAnchor virtualRef={{ current: targetElm }} />
      {open && (
        <PopoverContent
          side={side}
          align={align}
          sideOffset={10}
          className="bg-gray-800 max-w-64 px-3 py-2 shadow-xl"
        >
          <p className="text-sm text-white whitespace-pre-wrap">{children}</p>
          <PopoverArrow className="fill-gray-800" height={6} />
        </PopoverContent>
      )}
    </Popover>
  )
}
