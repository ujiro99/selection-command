import { useEffect, useState, type CSSProperties } from "react"
import clsx from "clsx"
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
  PopoverArrow,
} from "@/components/ui/popover"
import { usePopupContext } from "@/hooks/usePopupContext"
import { useZoomCompensation } from "@/hooks/usePageZoom"
import zc from "@/components/zoomCompensation.module.css"
import { SIDE } from "@/const"

// Sizes in px matching the Tailwind classes below, scaled by the zoom
// compensation inside the selection menu.
const FONT_SIZE = 12 // text-xs
const PADDING_X = 8 // px-2
const PADDING_Y = 6 // py-1.5
const MIN_WIDTH = 16 // min-w-4
const SIDE_OFFSET = 4 // PopoverContent default
const ARROW_WIDTH = 10
const ARROW_HEIGHT = 6

const zoomStyle = (zoomCompensation: number): CSSProperties | undefined =>
  zoomCompensation !== 1
    ? {
        padding: `${PADDING_Y * zoomCompensation}px ${PADDING_X * zoomCompensation}px`,
        minWidth: MIN_WIDTH * zoomCompensation,
      }
    : undefined

type PopupProps = {
  text: string
  positionElm: Element | null
  disabled?: boolean
  delay?: number
  className?: string
  // Overrides the side where the tooltip is shown.
  side?: SIDE
}

export function Tooltip(props: PopupProps) {
  const { side, inTransition, inOnboarding } = usePopupContext()
  const zoomCompensation = useZoomCompensation()
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
            "bg-gray-800 dark:bg-gray-600 min-w-4 px-2 py-1.5 shadow-md",
            props.className,
            // Only inside the menu, not to override the caller's className.
            zoomCompensation !== 1 && [zc.rounded, zc.shadowMd],
          )}
          style={zoomStyle(zoomCompensation)}
          side={props.side ?? (side === SIDE.bottom ? SIDE.bottom : "top")}
          sideOffset={SIDE_OFFSET * zoomCompensation}
          arrowPadding={-1}
        >
          <p
            className="text-xs text-white whitespace-pre-wrap"
            style={
              zoomCompensation !== 1
                ? { fontSize: FONT_SIZE * zoomCompensation }
                : undefined
            }
          >
            {props.text}
          </p>
          <PopoverArrow
            className="fill-gray-800 dark:fill-gray-600"
            width={ARROW_WIDTH * zoomCompensation}
            height={ARROW_HEIGHT * zoomCompensation}
          />
        </PopoverContent>
      )}
    </Popover>
  )
}
