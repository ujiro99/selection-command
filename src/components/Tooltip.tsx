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
  const [isHover, setIsHover] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(isHover)
  }, [isHover])

  const MyPopoverButton = forwardRef(function (props, ref) {
    return <div className={tooltipTrigger} ref={ref} {...props} />
  })

  return (
    <Popover>
      <PopoverButton as={MyPopoverButton} ref={positionRef}>
        {({ hover }) => {
          setIsHover(hover)
          return <>{props.children}</>
        }}
      </PopoverButton>
      <Transition show={visible && props.disabled}>
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
