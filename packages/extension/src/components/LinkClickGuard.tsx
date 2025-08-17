import React, { useState, useEffect, useRef } from "react"
import { Point } from "@/types"
type LinkClickGuardProps = {
  show: boolean
  position: Point
}

export const LinkClickGuard = (props: LinkClickGuardProps) => {
  const { show, position } = props
  const [guard, setGuard] = useState(show)
  const mouseDownRef = useRef(false)
  const timeoutRef = useRef(0)

  useEffect(() => {
    if (show) {
      setGuard(true)
      mouseDownRef.current = true
      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = 0
        if (mouseDownRef.current) return
        setGuard(false)
      }, 500)
      return () => {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = 0
      }
    }
  }, [show])

  useEffect(() => {
    const mouseUp = () => {
      mouseDownRef.current = false
      if (timeoutRef.current === 0) {
        setGuard(false)
      }
    }
    document.addEventListener("mouseup", mouseUp)
    return () => {
      document.removeEventListener("mouseup", mouseUp)
    }
  }, [])

  const styles = {
    position: "absolute",
    top: window.scrollY + position.y - 5,
    left: window.scrollX + position.x - 5,
    height: 10,
    width: 10,
    zIndex: 2147483691,
    // background: 'blue',
  } as React.CSSProperties

  return guard && <div style={styles} />
}
