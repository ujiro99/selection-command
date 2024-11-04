import React, { useContext, useEffect, useState } from 'react'
import clsx from 'clsx'
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
  PopoverArrow,
} from '@/components/ui/popover'
import { popupContext } from '@/components/Popup'

type PopupProps = {
  text: string
  positionElm: Element | null
  disabled?: boolean
}

import css from './Tooltip.module.css'

export function Tooltip(props: PopupProps) {
  const { side } = useContext(popupContext)
  const [visible, setVisible] = useState(false)
  const [inEnter, setInEnter] = useState(false)
  const elm = props.positionElm

  useEffect(() => {
    const show = () => {
      setInEnter(true)
      setVisible(true)
      // 10 ms longer than the animation delay to suppress flickering.
      setTimeout(() => {
        setInEnter(false)
      }, 310)
    }
    const hide = () => setVisible(false)

    if (elm) {
      elm.addEventListener('mouseenter', show)
      elm.addEventListener('mouseleave', hide)
    }
    return () => {
      if (elm) {
        elm.removeEventListener('mouseenter', show)
        elm.removeEventListener('mouseleave', hide)
      }
    }
  }, [elm])

  if (props.disabled || !elm) {
    return null
  }

  return (
    <Popover open={visible}>
      <PopoverAnchor virtualRef={{ current: props.positionElm }} />
      <PopoverContent
        className={clsx(
          'bg-gray-800 min-w-4 bg-gray-800 px-2 py-1.5 text-xs text-white shadow-md',
          css.enterDelay300,
          {
            [css.hidden]: inEnter,
          },
        )}
        side={side}
        arrowPadding={-1}
      >
        {props.text}
        <PopoverArrow className="fill-gray-800" height={6} />
      </PopoverContent>
    </Popover>
  )
}
