import React from 'react'
import clsx from 'clsx'
import { Popover, PopoverPanel, Transition } from '@headlessui/react'
import { useFloating, flip, autoUpdate } from '@floating-ui/react'
import { offset } from '@floating-ui/dom'

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

  const { refs, floatingStyles } = useFloating({
    placement: placement,
    elements: { reference: props.positionRef.current },
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(5),
      flip({
        fallbackPlacements: ['top', 'bottom'],
      }),
    ],
  })

  const visible = props.visible && props.positionRef.current != null

  return (
    <Popover className={popupCss.popupContianer}>
      <Transition show={visible}>
        <PopoverPanel
          ref={refs.setFloating}
          style={floatingStyles}
          data-placement={placement}
          static
        >
          <div className={`${popupCss.popup} ${css.resultPopup}`}>
            {props.children}
            <button
              className={clsx(css.closeButton, css.resultPopupButton)}
              onClick={props.onClose}
            >
              <Icon name="close" />
            </button>
          </div>
        </PopoverPanel>
      </Transition>
    </Popover>
  )
}
