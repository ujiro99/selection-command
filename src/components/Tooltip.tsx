import React, { useState, useEffect } from 'react'
import { Popover, PopoverPanel, Transition } from '@headlessui/react'
import type { Placement } from '@popperjs/core'

import { useSetting } from '../hooks/useSetting'
import {
  tooltip,
  arrow,
  popupFrom,
  popupTo,
  popdownFrom,
  popdownTo,
} from './Tooltip.module.css'

type PopupProps = {
  positionRef: React.RefObject<Element>
  children: React.ReactNode
}

export function Tooltip(props: PopupProps) {
  const { settings } = useSetting()
  const positionElm = props.positionRef?.current
  const popupPlacement = settings.popupPlacement
  let placement = 'top' as Placement
  let enterFrom = popupFrom
  let enterTo = popupTo
  if (popupPlacement.startsWith('bottom')) {
    placement = 'bottom'
    enterFrom = popdownFrom
    enterTo = popdownTo
  }

  const [visible, setVisible] = useState(false)
  const [arrowElm, setArrowElm] = useState(null)

  const toggleVisible = () => {
    setVisible((visible) => !visible)
  }

  useEffect(() => {
    if (positionElm == null) {
      return
    }
    positionElm.addEventListener('mouseenter', toggleVisible)
    positionElm.addEventListener('mouseleave', toggleVisible)
    return () => {
      if (positionElm == null) {
        return
      }
      positionElm.removeEventListener('mouseenter', toggleVisible)
      positionElm.removeEventListener('mouseleave', toggleVisible)
    }
  }, [positionElm])

  return (
    <Popover>
      <Transition
        show={visible}
        enter="transition duration-75 delay-350 ease-out"
        enterFrom={enterFrom}
        enterTo={enterTo}
        leave="transition duration-50 ease-out"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <PopoverPanel className={tooltip} static>
          {props.children}
          <div className={arrow} ref={setArrowElm} />
        </PopoverPanel>
      </Transition>
    </Popover>
  )
}
