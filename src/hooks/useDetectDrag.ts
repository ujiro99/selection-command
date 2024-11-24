import { useState, useEffect } from 'react'
import { MOUSE, DRAG_OPEN_MODE } from '@/const'
import { Point } from '@/types'
import { ExecState } from '@/action'
import { LinkPreview } from '@/action/linkPreview'
import { useSetting } from '@/hooks/useSetting'
import { isPopup, isAnchorElement, getScreenSize } from '@/services/util'

const isTargetEvent = (e: MouseEvent): boolean => {
  return (
    e.button === MOUSE.LEFT &&
    !isPopup(e.target as Element) &&
    isAnchorElement(e.target as Element)
  )
}

export function useDetectDrag() {
  const [startPosition, setStartPosition] = useState<Point | null>()
  const [activate, setActivate] = useState(false)
  const { settings } = useSetting()
  const command = settings.commands.find(
    (c) => c.openMode === DRAG_OPEN_MODE.LINK_PREVIEW,
  )

  const onChangeState = (state: ExecState, message?: string) => {
    console.debug({ state, message })
  }

  useEffect(() => {
    const handleDragStart = (e: MouseEvent) => {
      if (!isTargetEvent(e)) return
      setStartPosition({ x: e.clientX, y: e.clientY })
    }

    const handleDragOver = (e: DragEvent) => {
      if (e.button !== MOUSE.LEFT) return
      if (startPosition == null) return
      e.preventDefault()

      const current = { x: e.clientX, y: e.clientY }
      const distance = Math.sqrt(
        Math.pow(current.x - startPosition.x, 2) +
          Math.pow(current.y - startPosition.y, 2),
      )
      if (distance > 100) {
        setActivate(true)
      }
    }

    const handleDragEnd = (e: MouseEvent) => {
      if (e.button !== MOUSE.LEFT) return
      e.preventDefault()
      e.stopPropagation()

      if (activate && command) {
        const screen = getScreenSize()
        const position = { x: e.screenX, y: e.screenY }
        if (
          command.popupOption &&
          command.popupOption.width + e.screenX > screen.width
        ) {
          position.x = screen.width - command.popupOption.width
        }
        LinkPreview.execute({
          selectionText: '',
          command,
          position,
          useSecondary: false,
          changeState: onChangeState,
          target: e.target as Element,
        })
        setActivate(false)
        setStartPosition(null)
      }
    }

    window.addEventListener('dragstart', handleDragStart)
    window.addEventListener('dragend', handleDragEnd)
    window.addEventListener('dragover', handleDragOver)
    return () => {
      window.removeEventListener('dragstart', handleDragStart)
      window.removeEventListener('dragend', handleDragEnd)
      window.removeEventListener('dragover', handleDragOver)
    }
  }, [startPosition, activate, command])
}
