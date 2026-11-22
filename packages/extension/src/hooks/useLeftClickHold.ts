import { useState, useEffect, useRef } from "react"
import { MOUSE } from "@/const"

import { isPopup } from "@/lib/utils"
import {
  findAnchorElement,
  findClickableElement,
  isInDisabledArea,
} from "@/services/dom"
import type { Point } from "@/types"

const isTargetEvent = (e: MouseEvent): boolean => {
  return e.button === MOUSE.LEFT && !isPopup(e.target as Element)
}

const findTarget = (e: MouseEvent, anchorOnly: boolean): Element | null => {
  const anchor = findAnchorElement(e)
  if (anchor != null || anchorOnly) return anchor ?? null
  return findClickableElement(e.target as Element)
}

// Distance in pixels the pointer may move before a hold is cancelled.
const MOVE_TOLERANCE = 5

type useLeftClickHoldParam = {
  enable: boolean
  holdDuration: number
  /**
   * Cancel the hold when the pointer moves or a native drag starts, so that
   * dragging a link (e.g. to the bookmarks bar) does not count as a hold.
   */
  cancelOnMove?: boolean
  /**
   * Only start a hold on links. Buttons and other clickable elements are
   * ignored, so a long press on them never triggers an action.
   */
  anchorOnly?: boolean
}
export function useLeftClickHold(props: useLeftClickHoldParam) {
  const {
    enable,
    holdDuration,
    cancelOnMove = false,
    anchorOnly = false,
  } = props
  const [detectHold, setDetectHold] = useState(false)
  const [detectHoldLink, setDetectHoldLink] = useState(false)
  const [progress, setProgress] = useState(0)
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 })
  const [linkElm, setLinkElm] = useState<Element | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const intervalRef = useRef<ReturnType<typeof setInterval>>()
  // Where the pending hold started; null when no hold is pending.
  const startRef = useRef<Point | null>(null)

  useEffect(() => {
    release()
  }, [enable])

  useEffect(() => {
    if (!enable) return

    const handleMouseDown = (event: MouseEvent) => {
      if (!isTargetEvent(event)) return
      if (detectHold) release()
      // The page opted out of the popups for this area. Checked after the
      // release above, so a click here still closes a previously held popup.
      if (isInDisabledArea(event.target as Node)) return
      if (anchorOnly && findAnchorElement(event) == null) return

      // Set initial state
      startRef.current = { x: event.clientX, y: event.clientY }
      setProgress(0)
      setPosition({ x: event.clientX, y: event.clientY })

      // Start count of hold.
      timeoutRef.current = setTimeout(() => {
        startRef.current = null
        const el = findTarget(event, anchorOnly)
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
      startRef.current = null
      clearTimeout(timeoutRef.current)
      clearInterval(intervalRef.current)
    }

    // Stop the pending hold without touching a hold already detected.
    const cancelPending = () => {
      if (startRef.current == null) return
      startRef.current = null
      clearTimeout(timeoutRef.current)
      clearInterval(intervalRef.current)
      setProgress(0)
    }

    const handleMouseMove = (event: MouseEvent) => {
      const start = startRef.current
      if (start == null) return
      const dx = event.clientX - start.x
      const dy = event.clientY - start.y
      if (Math.hypot(dx, dy) > MOVE_TOLERANCE) cancelPending()
    }

    window.addEventListener("mousedown", handleMouseDown)
    window.addEventListener("mouseup", handleMouseUp)
    if (cancelOnMove) {
      window.addEventListener("mousemove", handleMouseMove)
      // A native drag stops mousemove/mouseup events reaching the window.
      window.addEventListener("dragstart", cancelPending)
    }
    return () => {
      window.removeEventListener("mousedown", handleMouseDown)
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("dragstart", cancelPending)
    }
  }, [
    enable,
    holdDuration,
    cancelOnMove,
    anchorOnly,
    detectHold,
    timeoutRef,
    props,
  ])

  const release = () => {
    startRef.current = null
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
