import { useEffect, useState } from "react"
import clsx from "clsx"
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
  PopoverArrow,
} from "@/components/ui/popover"
import { usePopupContext } from "@/hooks/usePopupContext"
import { SIDE } from "@/const"

type PopupProps = {
  text: string
  positionElm: Element | null
  disabled?: boolean
  delay?: number
  className?: string
}

export function Tooltip(props: PopupProps) {
  const { side, inTransition, inOnboarding } = usePopupContext()
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
  }, [isOpen, delay])

  if (inTransition || inOnboarding || props.disabled || !elm) {
    return null
  }

  return (
    <Popover open={isOpen}>
      <PopoverAnchor virtualRef={{ current: props.positionElm }} />
      {shouldRender && (
        <PopoverContent
          className={clsx(
            "bg-gray-800 min-w-4 px-2 py-1.5 shadow-md",
            props.className,
          )}
          side={side === SIDE.bottom ? SIDE.bottom : "top"}
          arrowPadding={-1}
        >
          <p className="text-xs text-white whitespace-pre-wrap">{props.text}</p>
          <PopoverArrow className="fill-gray-800" height={6} />
        </PopoverContent>
      )}
    </Popover>
  )
}
