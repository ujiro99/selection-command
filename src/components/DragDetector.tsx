import React from 'react'
import { useDetectDrag } from '@/hooks/useDetectDrag'
import { CircularProgress } from '@/components/CircularProgress'

export function DragDetector(): JSX.Element {
  const { progress, dragPosition } = useDetectDrag()

  if (!dragPosition) return <></>

  const styles = {
    position: 'absolute',
    top: window.scrollY + dragPosition.y - 30,
    left: window.scrollX + dragPosition.x + 5,
    height: 2,
    width: 2,
    pointerEvents: 'none',
    zIndex: 2147483647,
    // backgroundColor: 'rgba(255, 0, 0, 0.3)',
    // border: '1px solid red',
  } as React.CSSProperties

  return (
    <div style={styles}>
      <CircularProgress progress={progress} />
    </div>
  )
}
