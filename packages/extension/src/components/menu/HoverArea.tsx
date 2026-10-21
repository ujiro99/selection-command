import { useState, useEffect, type RefObject } from "react"
import { createPortal } from "react-dom"

type Props = {
  anchorRef: RefObject<HTMLElement>
  contentRef: RefObject<HTMLElement>
  isHorizontal: boolean
}

type Placement = "top" | "bottom" | "left" | "right"

type Rects = {
  anchor: DOMRect
  content: DOMRect
}

const isSameRect = (a: DOMRect, b: DOMRect) =>
  a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height

/**
 * Returns the portal container for the given element.
 * Uses the ShadowRoot when the element lives in shadow DOM so that the
 * hover area shares the same style scope, otherwise falls back to the body.
 */
const getPortalContainer = (elm: HTMLElement): Element | ShadowRoot => {
  const root = elm.getRootNode()
  return root instanceof ShadowRoot ? root : document.body
}

/**
 * Invisible area that bridges the anchor and the content so that the pointer
 * can move between them without leaving the hover state.
 *
 * It is rendered through a portal outside the content element so that the
 * content's enter/exit transforms (zoom, slide) are not applied to the area.
 * React synthetic mouseenter/mouseleave events follow the component tree,
 * so hovering this area is still treated as hovering the content.
 */
export const HoverArea = (props: Props) => {
  const { anchorRef, contentRef, isHorizontal } = props
  const [rects, setRects] = useState<Rects | null>(null)
  const [container, setContainer] = useState<Element | ShadowRoot | null>(null)

  useEffect(() => {
    const anchor = anchorRef.current
    const content = contentRef.current
    if (!anchor || !content) return

    setContainer(getPortalContainer(anchor))

    let rafId: number | null = null
    let isMonitoring = false
    let disposed = false
    let last: Rects | null = null

    const update = () => {
      if (disposed) return
      const next = {
        anchor: anchor.getBoundingClientRect(),
        content: content.getBoundingClientRect(),
      }

      // Skip re-render when neither position nor size has changed
      if (
        last &&
        isSameRect(last.anchor, next.anchor) &&
        isSameRect(last.content, next.content)
      ) {
        return
      }
      last = next
      setRects(next)
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

    // Animation and transition events bubble, so ignore those from descendants
    // (e.g. hover transitions of menu items) to avoid stopping monitoring
    // while the anchor or content itself is still animating.
    const onAnimationStart = (e: Event) => {
      if (e.target !== e.currentTarget) return
      start()
    }
    const onAnimationEnd = (e: Event) => {
      if (e.target !== e.currentTarget) return
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

    // The area is fixed to the viewport, so follow the elements on page scroll
    const scrollOptions = { capture: true, passive: true } as const
    window.addEventListener("scroll", update, scrollOptions)
    window.addEventListener("resize", update)

    return () => {
      disposed = true
      stop()
      clearTimeout(fallbackTimeout)
      resizeObserver.disconnect()
      window.removeEventListener("scroll", update, scrollOptions)
      window.removeEventListener("resize", update)
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

  if (!rects || !container) {
    return null
  }
  const { anchor, content } = rects

  // SVG size and position (viewport coordinates)
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
      break
  }

  return createPortal(
    <svg
      width={width}
      height={height}
      viewBox={`${x} ${y} ${width} ${height}`}
      style={{
        pointerEvents: "none",
        position: "fixed",
        top: y,
        left: x,
        zIndex: 2147483647,
      }}
    >
      <path
        d={d}
        fill={"skyblue"}
        fillOpacity="0"
        style={{ pointerEvents: "auto" }}
      />
    </svg>,
    container,
  )
}
