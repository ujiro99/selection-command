import React from 'react'

type Props = {
  anchor: DOMRect | null
  content: DOMRect | null
}

export const HoverArea = (props: Props) => {
  const { anchor, content } = props

  if (!anchor || !content) {
    return null
  }

  // SVG size and position
  const x = Math.min(anchor.x, content.x)
  const y = Math.min(anchor.y, content.y)
  const width = Math.max(anchor.right, content.right) - x
  const height = Math.max(anchor.bottom, content.bottom) - y

  // Anchor placement
  const isLeft = anchor.x <= content.x
  const isTop = anchor.y <= content.y
  const isRight = anchor.right >= content.right
  const isBottom = anchor.bottom >= content.bottom

  let top = 0
  let left = 0
  let d

  if (isLeft) {
    d = `M ${anchor.x} ${anchor.y}
         Q ${content.x} ${anchor.y},
           ${content.x} ${content.y}
         v ${content.height}
         Q ${content.x} ${anchor.bottom},
           ${anchor.x} ${anchor.bottom}
         h ${anchor.width}
         v ${-anchor.height}
         z`
    left = -anchor.width
  } else if (isTop) {
    d = `M ${anchor.right} ${anchor.top}
         Q ${anchor.right} ${content.top},
           ${content.right} ${content.top}
         h ${-content.width}
         Q ${anchor.x} ${content.top},
           ${anchor.x} ${anchor.top}
         v ${anchor.height}
         h ${anchor.width}
         z`
    top = -anchor.height - 2
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
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`${x} ${y} ${width} ${height}`}
      style={{ pointerEvents: 'none', position: 'absolute', top, left }}
    >
      <path
        d={d}
        fill={'#fff'}
        fillOpacity="0"
        style={{ pointerEvents: 'auto' }}
      />
    </svg>
  )
}
