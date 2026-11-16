import React, { useRef, type CSSProperties } from "react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover"
import { useUserSettings } from "@/hooks/useSettings"
import { useZoomCompensation } from "@/hooks/usePageZoom"
import { SIDE } from "@/const"
import { t } from "@/services/i18n"
import { AppWindow } from "lucide-react"
import type { HoverCardState } from "@/hooks/useHoverCard"
import { HoverCardError, HoverCardLoading } from "./HoverCardMessage"
import css from "./HoverCard.module.css"
import zc from "@/components/zoomCompensation.module.css"

// PopoverContent default
const SIDE_OFFSET = 4

type Props = {
  open: boolean
  state: HoverCardState
  anchorRef: React.RefObject<Element>
  cardProps: React.HTMLAttributes<HTMLDivElement>
  /** Reopens the card as a window that stays open. */
  onKeep: () => void
}

/** Card attached to a menu item that shows the hover card result. */
export function HoverCardPanel({
  open,
  state,
  anchorRef,
  cardProps,
  onKeep,
}: Props) {
  const { userSettings } = useUserSettings()
  const isBottom = userSettings?.popupPlacement?.side === SIDE.bottom
  const zoomCompensation = useZoomCompensation()

  const virtualRef = useRef<Element | null>(null)
  virtualRef.current = anchorRef.current

  const visible = open && anchorRef.current != null

  return (
    <Popover open={visible}>
      <PopoverAnchor virtualRef={virtualRef} />
      <PopoverContent
        side={isBottom ? SIDE.bottom : SIDE.top}
        sideOffset={SIDE_OFFSET * zoomCompensation}
        className={cn(
          "bg-background rounded-md border",
          zc.border,
          zc.rounded,
          zc.shadowXl,
        )}
        style={{ "--sc-zoom-compensation": zoomCompensation } as CSSProperties}
        {...cardProps}
      >
        <div className={css.card}>
          <HoverCardBody state={state} />
          <div className={css.footer}>
            <button type="button" className={css.keepButton} onClick={onKeep}>
              <AppWindow className={css.keepIcon} aria-hidden />
              {t("HoverCard_keep")}
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function HoverCardBody({ state }: { state: HoverCardState }) {
  switch (state.status) {
    case "success":
      return <>{state.content}</>
    case "error":
      return <HoverCardError kind={state.kind} />
    case "loading":
      return <HoverCardLoading progress={state.progress} />
    default:
      return <HoverCardLoading />
  }
}
