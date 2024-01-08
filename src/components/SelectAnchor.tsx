import React, { useState, useEffect, forwardRef } from 'react'
import { APP_ID } from '../const'

type Props = {
  isSelected: boolean
}

function getLineHeight() {
  const s = document.getSelection()
  const e = s?.focusNode?.parentElement
  if (e == null) return
  return window.getComputedStyle(e).getPropertyValue('line-height')
}

function isPopup(elm: Element): Boolean {
  if (elm == null) return false
  if (elm.id === APP_ID) return true
  if (elm.nodeName === 'body') return false
  return isPopup(elm.parentElement as Element)
}

export const SelectAnchor = forwardRef<HTMLDivElement, Props>(
  (props: Props, ref) => {
    const [isMouseDown, setIsMouseDown] = useState(false)
    const [mousePosition, setMousePosition] = useState({
      left: 0,
      top: 0,
    })

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

    useEffect(() => {
      const onDblClick = (e: MouseEvent) => {
        setMousePosition({
          left: e.pageX,
          top: e.pageY,
        })
      }
      document.addEventListener('dblclick', onDblClick)
      return () => {
        document.removeEventListener('dblclick', onDblClick)
      }
    }, [isMouseDown])

    useEffect(() => {
      const onMove = (e: MouseEvent) => {
        setMousePosition({
          left: e.pageX,
          top: e.pageY,
        })
      }
      if (isMouseDown) {
        document.addEventListener('mousemove', onMove)
      } else {
        document.removeEventListener('mousemove', onMove)
      }
      return () => {
        document.removeEventListener('mousemove', onMove)
      }
    }, [isMouseDown])

    if (!props.isSelected || isMouseDown) {
      return
    }

    const styles = {
      position: 'absolute',
      top: mousePosition.top,
      left: mousePosition.left,
      height: getLineHeight(),
      pointerEvents: 'none',
      transform: 'translateY(-50%)',
    } as React.CSSProperties

    return <div style={styles} ref={ref}></div>
  },
)
