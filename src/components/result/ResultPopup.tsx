import React, { useRef } from 'react'
import clsx from 'clsx'
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover'

import { useSetting } from '@/hooks/useSetting'
import { Icon } from '@/components/Icon'
import popupCss from '@/components/Popup.module.css'
import css from './ResultPopup.module.css'

type PopupProps = {
  visible: boolean
  positionRef: React.RefObject<Element>
  children: React.ReactNode
  onClose: () => void
}

export function ResultPopup(props: PopupProps) {
  const { settings } = useSetting()
  const placement = settings.popupPlacement
  const isBottom = placement.startsWith('bottom')

  const visible = props.visible && props.positionRef.current != null

  const virtualRef = useRef<Element | null>(null)
  if (props.positionRef) virtualRef.current = props.positionRef.current

  return (
    <Popover open={visible}>
      <PopoverAnchor virtualRef={virtualRef} />
      <PopoverContent
        side={isBottom ? 'bottom' : 'top'}
        className="bg-background rounded-md border"
      >
        <div className={clsx(popupCss.popup, css.resultPopup)}>
          {props.children}
          <button
            className={clsx(css.closeButton, css.resultPopupButton)}
            onClick={props.onClose}
          >
            <Icon name="close" />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
