import { useState, useEffect, useRef } from 'react'
import { MOUSE } from '@/const'

import { isPopup } from '@/lib/utils'
import { findAnchorElement, findClickableElement } from '@/services/dom'
import type { Point } from '@/types'

const isTargetEvent = (e: MouseEvent): boolean => {
  return e.button === MOUSE.LEFT && !isPopup(e.target as Element)
}

const findTarget = (e: MouseEvent): Element | null => {
  const anchor = findAnchorElement(e)
  if (anchor != null) return anchor
  return findClickableElement(e.target as Element)
}

type useLeftClickHoldParam = {
  enable: boolean
  holdDuration: number
}
export function useLeftClickHold(props: useLeftClickHoldParam) {
  const { enable, holdDuration } = props
  const [detectHold, setDetectHold] = useState(false)
  const [detectHoldLink, setDetectHoldLink] = useState(false)
  const [progress, setProgress] = useState(0)
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 })
  const [linkElm, setLinkElm] = useState<Element | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    release()
  }, [enable])

  useEffect(() => {
    if (!enable) return

    const handleMouseDown = (event: MouseEvent) => {
      if (!isTargetEvent(event)) return
      if (detectHold) release()

      // Set initial state
      setProgress(0)
      setPosition({ x: event.clientX, y: event.clientY })

      // Start count of hold.
      timeoutRef.current = setTimeout(() => {
        const el = findTarget(event)
        setDetectHold(true)
        setDetectHoldLink(el != null)
        setLinkElm(el as Element)
      }, holdDuration)

      // Update progress
      const start = performance.now()
      const intervalTO = setInterval(() => {
        const now = performance.now()
        const progress = Math.round(((now - start) / holdDuration) * 100)
        setProgress(Math.min(100, progress))
        if (progress >= 100) {
          // To clear interval, hold the timeout in the closure.
          clearInterval(intervalTO)
        }
      }, holdDuration / 20)
      intervalRef.current = intervalTO
    }

    const handleMouseUp = () => {
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
    setProgress(0)
    setLinkElm(null)
    clearTimeout(timeoutRef.current)
    clearInterval(intervalRef.current)
  }

  return {
    detectHold,
    detectHoldLink,
    position,
    progress,
    linkElement: linkElm,
  }
}
