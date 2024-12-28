import { useState, useEffect, useRef } from 'react'
import { MOUSE } from '@/const'

import { isPopup } from '@/lib/utils'
import { findAnchorElement } from '@/services/dom'
import type { Point } from '@/types'

const isTargetEvent = (e: MouseEvent): boolean => {
  return e.button === MOUSE.LEFT && !isPopup(e.target as Element)
}

const hasAnchor = (e: MouseEvent): boolean => {
  return findAnchorElement(e) != null
}

type useLeftClickHoldParam = {
  enable: boolean
  selectionText: string
  holdDuration: number
}
export function useLeftClickHold(props: useLeftClickHoldParam) {
  const { selectionText, enable, holdDuration } = props
  const [detectHold, setDetectHold] = useState(false)
  const [detectHoldLink, setDetectHoldLink] = useState(false)
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 })
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    release()
  }, [selectionText])

  useEffect(() => {
    if (!enable) return

    const handleMouseDown = (event: MouseEvent) => {
      if (!isTargetEvent(event)) return
      if (detectHold) {
        release()
      }
      if (props.selectionText) {
        // If there is a selection-text, start count of hold.
        timeoutRef.current = setTimeout(() => {
          setDetectHold(true)
          setDetectHoldLink(hasAnchor(event))
          setPosition({ x: event.clientX, y: event.clientY })
        }, holdDuration)
      } else {
        release()
      }
    }

    const handleMouseUp = (event: MouseEvent) => {
      if (!isTargetEvent(event)) return
      clearTimeout(timeoutRef.current)
    }

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [enable, holdDuration, detectHold, timeoutRef, props])

  const release = () => {
    setDetectHold(false)
    setDetectHoldLink(false)
    setPosition({ x: 0, y: 0 })
  }

  return { detectHold, detectHoldLink, position }
}
