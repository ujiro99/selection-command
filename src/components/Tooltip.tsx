import React, { useState, useEffect } from 'react'
import { Popover, Transition } from '@headlessui/react'
import { usePopper } from 'react-popper'

import { useSetting } from '../hooks/useSetting'
import { tooltip, arrow } from './Tooltip.module.css'

type PopupProps = {
  positionElm: Element | null
  children: React.ReactNode
}

export function Tooltip(props: PopupProps) {
  const { settings } = useSetting()
  const popupPlacement = settings.popupPlacement
  let placement = 'top'
  if (popupPlacement.startsWith('bottom')) {
    placement = 'bottom'
  }

  const [popperElement, setPopperElement] = useState<HTMLDivElement>()
  const [visible, setVisible] = useState(false)
  const [arrowElm, setArrowElm] = useState(null)
  const { styles, attributes } = usePopper(props.positionElm, popperElement, {
    placement: placement,
    modifiers: [
      {
        name: 'arrow',
        options: {
          element: arrowElm,
        },
      },
      {
        name: 'offset',
        options: {
          offset: [0, 10],
        },
      },
    ],
  })

  const toggleVisible = () => {
    setVisible((visible) => !visible)
  }

  useEffect(() => {
    if (props.positionElm == null) {
      return
    }
    props.positionElm.addEventListener('mouseenter', toggleVisible)
    props.positionElm.addEventListener('mouseleave', toggleVisible)
    return () => {
      if (props.positionElm == null) {
        return
      }
      props.positionElm.removeEventListener('mouseenter', toggleVisible)
      props.positionElm.removeEventListener('mouseleave', toggleVisible)
    }
  }, [props.positionElm])

  return (
    <Popover>
      <Transition
        show={visible}
        enter="transition duration-200 delay-350 ease-out"
        enterFrom="transform scale-95 opacity-0"
        enterTo="transform scale-100 opacity-100"
        leave="transition duration-75 ease-out"
        leaveFrom="transform scale-100 opacity-100"
        leaveTo="transform scale-95 opacity-0"
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
