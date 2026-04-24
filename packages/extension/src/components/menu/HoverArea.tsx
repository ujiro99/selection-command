import { useState, useEffect, type RefObject } from "react"

type Props = {
  anchorRef: RefObject<HTMLElement>
  contentRef: RefObject<HTMLElement>
  isHorizontal: boolean
}

type Placement = "top" | "bottom" | "left" | "right"

export const HoverArea = (props: Props) => {
  const { anchorRef, contentRef, isHorizontal } = props
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const [contentRect, setContentRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    const anchor = anchorRef.current
    const content = contentRef.current
    if (!anchor || !content) return

    let rafId: number | null = null
    let isMonitoring = false

    const update = () => {
      setAnchorRect(anchor.getBoundingClientRect())
      setContentRect(content.getBoundingClientRect())
    }

    const loop = () => {
      if (isMonitoring) {
        update()
        rafId = requestAnimationFrame(loop)
      }
    }

    const start = () => {
      if (!isMonitoring) {
        isMonitoring = true
        loop()
      }
    }

    const stop = () => {
      isMonitoring = false
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      update()
    }

    update()

    // Track opening animation immediately on mount
    start()

    // Fallback: stop after 500ms if no animation events fire
    const fallbackTimeout = setTimeout(stop, 500)

    const onAnimationStart = () => start()
    const onAnimationEnd = () => {
      clearTimeout(fallbackTimeout)
      stop()
    }

    const startEvents = ["animationstart", "transitionstart"] as const
    const endEvents = [
      "animationend",
      "transitionend",
      "animationcancel",
      "transitioncancel",
    ] as const

    startEvents.forEach((e) => {
      anchor.addEventListener(e, onAnimationStart)
      content.addEventListener(e, onAnimationStart)
    })
    endEvents.forEach((e) => {
      anchor.addEventListener(e, onAnimationEnd)
      content.addEventListener(e, onAnimationEnd)
    })

    const resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(anchor)
    resizeObserver.observe(content)

    return () => {
      stop()
      clearTimeout(fallbackTimeout)
      resizeObserver.disconnect()
      startEvents.forEach((e) => {
        anchor.removeEventListener(e, onAnimationStart)
        content.removeEventListener(e, onAnimationStart)
      })
      endEvents.forEach((e) => {
        anchor.removeEventListener(e, onAnimationEnd)
        content.removeEventListener(e, onAnimationEnd)
      })
    }
  }, [anchorRef, contentRef])

  const anchor = anchorRect
  const content = contentRect

  if (!anchor || !content) {
    return null
  }

  // SVG size and position
  const x = Math.min(anchor.x, content.x)
  const y = Math.min(anchor.y, content.y)
  const width = Math.max(anchor.right, content.right) - x
  const height = Math.max(anchor.bottom, content.bottom) - y

  // Anchor placement
  const isTop = isHorizontal && anchor.y <= content.y
  const isBottom = isHorizontal && anchor.bottom >= content.bottom
  const isLeft = !isHorizontal && anchor.x <= content.x
  const placement: Placement = isTop
    ? "top"
    : isBottom
      ? "bottom"
      : isLeft
        ? "left"
        : "right"

  let top = 0
  let left = 0
  let d

  switch (placement) {
    case "top":
      d = `M ${anchor.right} ${anchor.top}
         v ${anchor.height / 4}
         Q ${anchor.right} ${content.top},
           ${content.right} ${content.top}
         h ${-content.width}
         Q ${anchor.x} ${content.top},
           ${anchor.x} ${anchor.top}
         h ${anchor.width}
         z`
      top = anchor.top - content.top
      break
    case "bottom":
      d = `M ${anchor.left} ${anchor.bottom}
         Q ${anchor.left} ${content.bottom},
           ${content.left} ${content.bottom}
         h ${content.width}
         Q ${anchor.right} ${content.bottom},
           ${anchor.right} ${anchor.bottom - anchor.height / 4}
         v ${anchor.height / 4}
         h ${-anchor.width}
         z`
      break
    case "left":
      d = `M ${anchor.x} ${anchor.y}
         Q ${content.x} ${anchor.y},
           ${content.x} ${content.y}
         v ${content.height}
         Q ${content.x} ${anchor.bottom},
           ${anchor.right - (anchor.width * 3) / 4} ${anchor.bottom}
         h ${-(anchor.width / 4)}
         v ${-anchor.height}
         z`
      left = -anchor.width + 2
      break
    case "right":
      d = `M ${anchor.right} ${anchor.top}
         Q ${content.right} ${anchor.top},
           ${content.right} ${content.top}
         v ${content.height}
         Q ${content.right} ${anchor.bottom},
           ${anchor.right - anchor.width / 4} ${anchor.bottom}
         h ${anchor.width / 4}
         v ${-anchor.height}
         z`
      left = -2
      break
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`${x} ${y} ${width} ${height}`}
      style={{
        pointerEvents: "none",
        position: "absolute",
        top,
        left,
      }}
    >
      <path
        d={d}
        fill={"skyblue"}
        fillOpacity="0"
        style={{ pointerEvents: "auto" }}
      />
    </svg>
  )
}
