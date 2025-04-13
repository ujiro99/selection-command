type Props = {
  anchor: DOMRect | null
  content: DOMRect | null
  isHorizontal: boolean
}

export const HoverArea = (props: Props) => {
  const { anchor, content, isHorizontal } = props

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
  const isRight = !isHorizontal && anchor.right >= content.right

  let top = 0
  let left = 0
  let d

  if (isTop) {
    d = `M ${anchor.right} ${anchor.top}
         Q ${anchor.right} ${content.top},
           ${content.right} ${content.top}
         h ${-content.width}
         Q ${anchor.x} ${content.top},
           ${anchor.x} ${anchor.top}
         v ${anchor.height}
         h ${anchor.width}
         z`
    top = anchor.top - content.top
  } else if (isBottom) {
    d = `M ${anchor.left} ${anchor.bottom}
         Q ${anchor.left} ${content.bottom},
           ${content.left} ${content.bottom}
         h ${content.width}
         Q ${anchor.right} ${content.bottom},
           ${anchor.right} ${anchor.bottom}
         v ${-anchor.height}
         h ${-anchor.width}
         z`
  } else if (isLeft) {
    d = `M ${anchor.x} ${anchor.y}
         Q ${content.x} ${anchor.y},
           ${content.x} ${content.y}
         v ${content.height}
         Q ${content.x} ${anchor.bottom},
           ${anchor.x} ${anchor.bottom}
         h ${anchor.width}
         v ${-anchor.height}
         z`
    left = -anchor.width + 2
  } else if (isRight) {
    d = `M ${anchor.right} ${anchor.top}
         Q ${content.right} ${anchor.top},
           ${content.right} ${content.top}
         v ${content.height}
         Q ${content.right} ${anchor.bottom},
           ${anchor.right} ${anchor.bottom}
         h ${-anchor.width}
         v ${-anchor.height}
         z`
    left = -2
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`${x} ${y} ${width} ${height}`}
      style={{
        pointerEvents: 'none',
        position: 'absolute',
        top,
        left,
      }}
    >
      <path
        d={d}
        fill={'skyblue'}
        fillOpacity="0"
        style={{ pointerEvents: 'auto' }}
      />
    </svg>
  )
}
