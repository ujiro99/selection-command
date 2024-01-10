import React, { useState, useEffect, forwardRef } from 'react'
import { APP_ID } from '../const'

type Props = {
  rect: DOMRect | undefined
  selectionText: string
}

function isPopup(elm: Element): Boolean {
  if (elm == null) return false
  if (elm.id === APP_ID) return true
  if (elm.nodeName === 'body') return false
  return isPopup(elm.parentElement as Element)
}

export const SelectAnchor = forwardRef<HTMLDivElement, Props>(
  (props: Props, ref) => {
    const rect = props.rect
    const text = props.selectionText
    const selected = text != null && text.length > 0
    const [isMouseDown, setIsMouseDown] = useState(false)

    useEffect(() => {
      const onDown = (e: MouseEvent) => {
        if (!isPopup(e.target as Element)) {
          setIsMouseDown(true)
        }
      }
      const onUp = () => {
        setIsMouseDown(false)
      }
      document.addEventListener('mousedown', onDown)
      document.addEventListener('mouseup', onUp)
      return () => {
        document.removeEventListener('mousedown', onDown)
        document.removeEventListener('mouseup', onUp)
      }
    }, [])

    if (rect == null || isMouseDown || !selected) return null

    const styles = {
      position: 'absolute',
      top: window.scrollY + rect.top,
      left: window.scrollX + rect.left,
      height: rect.height,
      width: rect.width,
      pointerEvents: 'none',
      padding: '4px', // adjust position of the Popup
    } as React.CSSProperties

    return <div style={styles} ref={ref}></div>
  },
)
