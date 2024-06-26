import React, { useState, useEffect, forwardRef } from 'react'
import { APP_ID } from '../const'

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

type Props = {
  selectionText: string
}
export const SelectAnchor = forwardRef<HTMLDivElement, Props>(
  (props: Props, ref) => {
    const text = props.selectionText
    const selected = text != null && text.length > 0
    const [isMouseDown, setIsMouseDown] = useState(false)
    const [startPoint, setStartPoint] = useState<Point>({} as Point)
    const [endPoint, setEndPoint] = useState<Point>({} as Point)

    useEffect(() => {
      const onDown = (e: MouseEvent) => {
        if (!isPopup(e.target as Element)) {
          setIsMouseDown(true)
          setStartPoint({ x: e.x, y: e.y })
        }
      }
      const onUp = (e: MouseEvent) => {
        if (!isPopup(e.target as Element)) {
        setIsMouseDown(false)
        setEndPoint({ x: e.x, y: e.y })
      }
      }
      document.addEventListener('mousedown', onDown)
      document.addEventListener('mouseup', onUp)
      return () => {
        document.removeEventListener('mousedown', onDown)
        document.removeEventListener('mouseup', onUp)
      }
    }, [])

    if (isMouseDown || !selected) return null

    const start = { ...startPoint }
    const end = { ...endPoint }
    if (startPoint.x > endPoint.x) {
      start.x = endPoint.x
      end.x = startPoint.x
    }
    if (startPoint.y > endPoint.y) {
      start.y = endPoint.y
      end.y = startPoint.y
    }

    const styles = {
      position: 'absolute',
      top: window.scrollY + start.y,
      left: window.scrollX + start.x,
      height: end.y - start.y,
      width: end.x - start.x,
      pointerEvents: 'none',
      padding: '4px', // adjust position of the Popup
    } as React.CSSProperties

    return <div style={styles} ref={ref} />
  },
)
