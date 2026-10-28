import React, { useRef, type CSSProperties } from "react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover"

import { useUserSettings } from "@/hooks/useSettings"
import { useZoomCompensation } from "@/hooks/usePageZoom"
import { X } from "lucide-react"
import popupCss from "@/components/Popup.module.css"
import { SIDE } from "@/const"
import css from "./ResultPopup.module.css"
import zc from "@/components/zoomCompensation.module.css"

// PopoverContent default
const SIDE_OFFSET = 4

type PopupProps = {
  visible: boolean
  positionRef: React.RefObject<Element>
  children: React.ReactNode
  className?: string
  onClose: () => void
}

export function ResultPopup(props: PopupProps) {
  const { userSettings } = useUserSettings()
  const placement = userSettings?.popupPlacement
  const isBottom = placement?.side === SIDE.bottom
  const zoomCompensation = useZoomCompensation()

  const visible = props.visible && props.positionRef.current != null

  const virtualRef = useRef<Element | null>(null)
  if (props.positionRef) virtualRef.current = props.positionRef.current

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
          props.className,
        )}
        // Set here as well: results of the context menu and shortcuts are
        // rendered outside the popup menu that sets it.
        style={{ "--sc-zoom-compensation": zoomCompensation } as CSSProperties}
      >
        <div className={cn(popupCss.popup, css.resultPopup)}>
          {props.children}
          {visible && (
            <button
              className={cn(css.closeButton, css.resultPopupButton)}
              onClick={props.onClose}
            >
              <X />
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
