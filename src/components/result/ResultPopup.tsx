import React from 'react'
import classNames from 'classnames'
import { Popover, PopoverPanel, Transition } from '@headlessui/react'
import { useFloating, flip, autoUpdate } from '@floating-ui/react'
import { offset } from '@floating-ui/dom'

import { useSetting } from '@/hooks/useSetting'
import { Icon } from '@/components/Icon'
import { popup, popupContianer } from '@/components/Popup.module.css'
import {
  resultPopup,
  resultPopupButton,
  closeButton,
} from './ResultPopup.module.css'

type PopupProps = {
  visible: boolean
  positionElm: Element | null
  children: React.ReactNode
  onClose: () => void
}

export function ResultPopup(props: PopupProps) {
  const { settings } = useSetting()
  const placement = settings.popupPlacement

  const { refs, floatingStyles } = useFloating({
    placement: placement,
    elements: { reference: props.positionElm },
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(5),
      flip({
        fallbackPlacements: ['top', 'bottom'],
      }),
    ],
  })

  const visible = props.visible && props.positionElm != null

  return (
    <Popover className={popupContianer}>
      <Transition show={visible}>
        <PopoverPanel
          ref={refs.setFloating}
          style={floatingStyles}
          data-placement={placement}
          static
        >
          <div className={`${popup} ${resultPopup}`}>
            {props.children}
            <button
              className={classNames(closeButton, resultPopupButton)}
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
