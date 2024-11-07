import React, { useState, useEffect, forwardRef, useContext } from 'react'
import { APP_ID } from '@/const'
import { context } from '@/components/App'
import { useLeftClickHold } from '@/hooks/useDetectStartup'
import { MOUSE } from '@/const'

function isPopup(elm: Element): boolean {
  if (elm == null) return false
  if (elm.id === APP_ID) return true
  if (elm.nodeName === 'body') return false
  return isPopup(elm.parentElement as Element)
}

type Point = {
  x: number
  y: number
}

type Rect = {
  start: Point
  end: Point
}

type Props = {
  selectionText: string
}

const PADDING = 16

export const SelectAnchor = forwardRef<HTMLDivElement, Props>(
  (props: Props, ref) => {
    const text = props.selectionText
    const selected = text != null && text.length > 0
    const { setTarget } = useContext(context)
    const [startPoint, setStartPoint] = useState<Point>({} as Point)
    const [rect, setRect] = useState<Rect>()
    const [offset, setOffset] = useState<Point>({} as Point)
    const { detectHold } = useLeftClickHold(props)

    useEffect(() => {
      // Offset of the body
      const style = window.getComputedStyle(document.documentElement)
      const x = parseInt(style.marginLeft, 10)
      const y = parseInt(style.marginTop, 10)
      setOffset({ x, y })
    }, [])

    useEffect(() => {
      const onDown = (e: MouseEvent) => {
        if (e.button !== MOUSE.LEFT) {
          return
        }
        if (!isPopup(e.target as Element)) {
          setStartPoint({ x: e.x, y: e.y })
          setTarget(e.target as Element)
        }
      }
      const onUp = (e: MouseEvent) => {
        if (e.button !== MOUSE.LEFT) {
          return
        }
        if (!isPopup(e.target as Element)) {
          if (e.detail >= 3) {
            // With triple-clicking, the entire phrase is selected.
            // In this case, it is treated the same as a double click.
            onDbl(e)
            return
          }

          const endPoint = { x: e.x, y: e.y }
          if (
            startPoint.x === endPoint.x &&
            startPoint.y === endPoint.y &&
            !detectHold
          ) {
            // Remove rect if it's a click
            setRect(undefined)
            return
          }

          if (detectHold) {
            // If hold detected, don't change rect.
            e.preventDefault()
            e.stopPropagation()
            return
          }

          const start = { ...startPoint }
          const end = { x: e.x, y: e.y }
          if (startPoint.x > endPoint.x) {
            start.x = endPoint.x
            end.x = startPoint.x
          }
          if (startPoint.y > endPoint.y) {
            start.y = endPoint.y
            end.y = startPoint.y
          }
          setRect({ start, end })
        }
      }
      const onDbl = (e: MouseEvent) => {
        if (e.button !== MOUSE.LEFT) {
          return
        }
        const start = { x: e.x - 5, y: e.y - 5 }
        const end = { x: e.x + 5, y: e.y + 5 }
        setRect({ start, end })
      }
      document.addEventListener('mousedown', onDown)
      document.addEventListener('mouseup', onUp)
      document.addEventListener('dblclick', onDbl)
      return () => {
        document.removeEventListener('mousedown', onDown)
        document.removeEventListener('mouseup', onUp)
        document.removeEventListener('dblclick', onDbl)
      }
    }, [setTarget, startPoint, detectHold])

    if (rect == null || !selected) return null

    const { start, end } = rect
    const styles = {
      position: 'absolute',
      top: window.scrollY + start.y - offset.y - PADDING,
      left: window.scrollX + start.x - offset.x - PADDING,
      height: end.y - start.y,
      width: end.x - start.x,
      pointerEvents: 'none',
      padding: PADDING, // adjust position of the Popup
      zIndex: 2147483647,
    } as React.CSSProperties

    return (
      <>
        <div style={styles} ref={ref} />
        <LinkClickGuard {...props} />
      </>
    )
  },
)

const LinkClickGuard = (props: Props) => {
  const { detectHoldLink, position } = useLeftClickHold(props)

  const styles = {
    position: 'absolute',
    top: window.scrollY + position?.y - 5,
    left: window.scrollX + position?.x - 5,
    height: 10,
    width: 10,
  } as React.CSSProperties

  return detectHoldLink && <div style={styles} />
}
