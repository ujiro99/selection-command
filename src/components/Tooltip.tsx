import { useContext, useEffect, useState } from "react"
import clsx from "clsx"
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
  PopoverArrow,
} from "@/components/ui/popover"
import { popupContext } from "@/components/Popup"
import { SIDE } from "@/const"

type PopupProps = {
  text: string
  positionElm: Element | null
  disabled?: boolean
  delay?: number
  className?: string
}

export function Tooltip(props: PopupProps) {
  const { side } = useContext(popupContext)
  const delay = props.delay ?? 300
  const [isOpen, setIsOpen] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const elm = props.positionElm

  useEffect(() => {
    const show = () => setIsOpen(true)
    const hide = () => setIsOpen(false)
    if (elm) {
      elm.addEventListener("mouseenter", show)
      elm.addEventListener("mouseleave", hide)
    }
    return () => {
      if (elm) {
        elm.removeEventListener("mouseenter", show)
        elm.removeEventListener("mouseleave", hide)
      }
    }
  }, [elm])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isOpen) {
      timer = setTimeout(() => {
        setShouldRender(true)
      }, delay)
    } else {
      setShouldRender(false)
    }
    return () => clearTimeout(timer)
  }, [isOpen])

  if (props.disabled || !elm) {
    return null
  }

  const noFocus = (e: Event) => e.preventDefault()

  return (
    <Popover open={isOpen}>
      <PopoverAnchor virtualRef={{ current: props.positionElm }} />
      {shouldRender && (
        <PopoverContent
          className={clsx(
            "bg-gray-800 min-w-4 bg-gray-800 px-2 py-1.5 text-xs text-white shadow-md",
            props.className,
          )}
          side={side === SIDE.bottom ? SIDE.bottom : "top"}
          arrowPadding={-1}
          onOpenAutoFocus={noFocus}
        >
          {props.text}
          <PopoverArrow className="fill-gray-800" height={6} />
        </PopoverContent>
      )}
    </Popover>
  )
}
