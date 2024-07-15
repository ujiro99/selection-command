import React from 'react'
import { Popover, PopoverPanel, Transition } from '@headlessui/react'
import { useFloating, flip, autoUpdate } from '@floating-ui/react'
import { offset } from '@floating-ui/dom'
import { useSetting } from '@/hooks/useSetting'

import {
  popup,
  popupContianer,
  popupTransition,
} from '@/components/Popup.module.css'

import { resultPopup } from './ResultPopup.module.css'

type PopupProps = {
  visible: boolean
  positionRef: React.RefObject<Element>
  children: React.ReactNode
}

export function ResultPopup(props: PopupProps) {
  const { settings } = useSetting()
  const placement = settings.popupPlacement

  const { refs, floatingStyles } = useFloating({
    placement: placement,
    elements: { reference: props.positionRef?.current },
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(5),
      flip({
        fallbackPlacements: ['top', 'bottom'],
      }),
    ],
  })

  return (
    <Popover className={popupContianer}>
      <Transition show={props.visible}>
        <PopoverPanel
          ref={refs.setFloating}
          style={floatingStyles}
          data-placement={placement}
          static
        >
          <div
            className={`${popup} ${popupTransition} ${resultPopup} transition`}
          >
            {props.children}
          </div>
        </PopoverPanel>
      </Transition>
    </Popover>
  )
}
