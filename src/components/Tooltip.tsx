import React, { useState, useEffect } from 'react'
import { Popover, Transition } from '@headlessui/react'
import { usePopper } from 'react-popper'

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
  let placement = 'top'
  let enterFrom = popupFrom
  let enterTo = popupTo
  if (popupPlacement.startsWith('bottom')) {
    placement = 'bottom'
    enterFrom = popdownFrom
    enterTo = popdownTo
  }

  const [popperElement, setPopperElement] = useState<HTMLDivElement>()
  const [visible, setVisible] = useState(false)
  const [arrowElm, setArrowElm] = useState(null)
  const { styles, attributes } = usePopper(positionElm, popperElement, {
    placement: placement,
    modifiers: [
      {
        name: 'arrow',
        options: {
          element: arrowElm,
          padding: 10,
        },
      },
      {
        name: 'offset',
        options: {
          offset: [0, 5],
        },
      },
    ],
  })

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
        <Popover.Panel
          ref={setPopperElement}
          style={styles.popper}
          {...attributes.popper}
          className={tooltip}
          static
        >
          {props.children}
          <div className={arrow} ref={setArrowElm} style={styles.arrow} />
        </Popover.Panel>
      </Transition>
    </Popover>
  )
}
