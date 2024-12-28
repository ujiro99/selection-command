import React from 'react'
import { useDetectLinkCommand } from '@/hooks/useDetectLinkCommand'
import { CircularProgress } from '@/components/CircularProgress'

export function DragDetector(): JSX.Element {
  const { showIndicator, inProgress, progress, mousePosition } =
    useDetectLinkCommand()

  if (!mousePosition || !inProgress) return <></>

  const styles = {
    position: 'absolute',
    height: 8,
    width: 8,
    top: window.scrollY + mousePosition.y - 4,
    left: window.scrollX + mousePosition.x - 4,
    zIndex: 2147483647,
    cursor: 'grabbing',
    // backgroundColor: 'rgba(255, 0, 0, 0.3)',
    // border: '1px solid red',
  } as React.CSSProperties

  const circleStyles = {
    top: -30,
    left: -15,
    opacity: showIndicator ? 1 : 0,
  }

  return (
    <div style={styles}>
      <CircularProgress style={circleStyles} progress={progress} />
    </div>
  )
}
