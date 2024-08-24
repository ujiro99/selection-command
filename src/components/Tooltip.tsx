import React, { useState, useRef, useEffect, forwardRef } from 'react'
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from '@headlessui/react'
import classNames from 'classnames'

import { useSetting } from '@/hooks/useSetting'
import { tooltip, tooltipTrigger, arrow } from './Tooltip.module.css'

type PopupProps = {
  children: React.ReactNode
  text: string
  disabled?: boolean
}

export function Tooltip(props: PopupProps) {
  const positionRef = useRef<HTMLButtonElement>(null)
  const arrowRef = useRef<HTMLDivElement>(null)

  const { settings } = useSetting()
  const popupPlacement = settings.popupPlacement
  let placement = 'top'
  if (popupPlacement.startsWith('bottom')) {
    placement = 'bottom'
  }
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const show = () => {
      if (props.disabled) return
      setVisible(true)
    }
    const hide = () => {
      setVisible(false)
    }
    if (positionRef.current != null) {
      positionRef.current.addEventListener('mouseenter', show)
      positionRef.current.addEventListener('mouseleave', hide)
    }
    return () => {
      if (positionRef.current != null) {
        positionRef.current.removeEventListener('mouseenter', show)
        positionRef.current.removeEventListener('mouseleave', hide)
      }
    }
  }, [positionRef.current, props.disabled])

  const MyPopoverButton = forwardRef(function (props, ref) {
    return <div className={tooltipTrigger} ref={ref} {...props} />
  })

  return (
    <Popover ref={positionRef}>
      <PopoverButton as={MyPopoverButton}>{props.children}</PopoverButton>
      <Transition show={visible && !props.disabled}>
        <PopoverPanel
          className={classNames(tooltip, 'transition')}
          data-placement={placement}
          static
        >
          {props.text}
          <div className={arrow} ref={arrowRef} />
        </PopoverPanel>
      </Transition>
    </Popover>
  )
}
