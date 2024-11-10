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

export function Tooltip(props: PopupProps) {
  const { side } = useContext(popupContext)
  const [isOpen, setIsOpen] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const elm = props.positionElm

  useEffect(() => {
    const show = () => setIsOpen(true)
    const hide = () => setIsOpen(false)
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

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isOpen) {
      timer = setTimeout(() => {
        setShouldRender(true)
      }, 300)
    } else {
      setShouldRender(false)
    }
    return () => clearTimeout(timer)
  }, [isOpen])

  if (props.disabled || !elm) {
    return null
  }

  return (
    <Popover open={isOpen}>
      <PopoverAnchor virtualRef={{ current: props.positionElm }} />
      {shouldRender && (
        <PopoverContent
          className={clsx(
            'bg-gray-800 min-w-4 bg-gray-800 px-2 py-1.5 text-xs text-white shadow-md',
          )}
          side={side}
          arrowPadding={-1}
        >
          {props.text}
          <PopoverArrow className="fill-gray-800" height={6} />
        </PopoverContent>
      )}
    </Popover>
  )
}
