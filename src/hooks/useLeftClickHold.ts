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
  const intervalRef = useRef<ReturnType<typeof setInterval>>()
  const progressRef = useRef(0)

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
      if (selectionText) {
        // If there is a selection-text, start count of hold.
        progressRef.current = 0
        const start = performance.now()
        timeoutRef.current = setTimeout(() => {
          setDetectHold(true)
          setDetectHoldLink(hasAnchor(event))
          setPosition({ x: event.clientX, y: event.clientY })
        }, holdDuration)
        intervalRef.current = setInterval(() => {
          const now = performance.now()
          const progress = Math.round(((now - start) / holdDuration) * 100)
          progressRef.current = Math.min(100, progress)
          if (progressRef.current >= 100) {
            clearInterval(intervalRef.current)
          }
        }, holdDuration / 10)
      } else {
        release()
      }
    }

    const handleMouseUp = (event: MouseEvent) => {
      if (!isTargetEvent(event)) return
      clearTimeout(timeoutRef.current)
      clearInterval(intervalRef.current)
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
    progressRef.current = 0
  }

  return { detectHold, detectHoldLink, position, progress: progressRef.current }
}
