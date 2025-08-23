import React, { useRef } from "react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover"

import { useUserSettings } from "@/hooks/useSettings"
import { Icon } from "@/components/Icon"
import popupCss from "@/components/Popup.module.css"
import { SIDE } from "@/const"
import css from "./ResultPopup.module.css"

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

  const visible = props.visible && props.positionRef.current != null

  const virtualRef = useRef<Element | null>(null)
  if (props.positionRef) virtualRef.current = props.positionRef.current

  return (
    <Popover open={visible}>
      <PopoverAnchor virtualRef={virtualRef} />
      <PopoverContent
        side={isBottom ? SIDE.bottom : SIDE.top}
        className={cn("bg-background rounded-md border", props.className)}
      >
        <div className={cn(popupCss.popup, css.resultPopup)}>
          {props.children}
          {visible && (
            <button
              className={cn(css.closeButton, css.resultPopupButton)}
              onClick={props.onClose}
            >
              <Icon name="close" />
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
