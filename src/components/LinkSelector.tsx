import React from 'react'
import { useDetectLinkCommand } from '@/hooks/useDetectLinkCommand'
import { LinkClickGuard } from '@/components/LinkClickGuard'
import { CircularProgress } from '@/components/CircularProgress'

export function LinkSelector(): JSX.Element {
  const {
    showIndicator,
    inProgress,
    progress,
    mousePosition,
    detectDrag,
    preventLinkClick,
  } = useDetectLinkCommand()

  if (!mousePosition || !inProgress) return <></>

  const styles = {
    position: 'absolute',
    height: 8,
    width: 8,
    top: window.scrollY + mousePosition.y - 4,
    left: window.scrollX + mousePosition.x - 4,
    zIndex: 2147483647,
    opacity: preventLinkClick ? 0 : 1,
    pointerEvents: 'none',
    // border: '1px solid red',
  } as React.CSSProperties

  if (detectDrag) {
    styles.cursor = 'grabbing'
    styles.pointerEvents = 'auto'
  }

  const circleStyles = {
    top: -30,
    left: -15,
    opacity: showIndicator ? 1 : 0,
  }

  return (
    <>
      <div style={styles}>
        <CircularProgress style={circleStyles} progress={progress} />
      </div>
      <LinkClickGuard
        show={preventLinkClick ?? false}
        position={mousePosition}
      />
    </>
  )
}
