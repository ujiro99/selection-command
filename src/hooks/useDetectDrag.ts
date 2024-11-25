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
  const [dragPosition, setDragPosition] = useState<Point | null>()
  const [activate, setActivate] = useState(false)
  const [progress, setProgress] = useState(0)
  const { settings } = useSetting()
  const command = settings.commands.find(
    (c) => c.openMode === DRAG_OPEN_MODE.LINK_PREVIEW,
  )
  const threshold = command?.dragOption?.threshold || 200

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
      if (distance > threshold) {
        setActivate(true)
        setProgress(100)
      } else {
        setActivate(false)
        setProgress(Math.floor((distance / threshold) * 100))
      }
      setDragPosition(current)
    }

    const handleDragEnd = (e: MouseEvent) => {
      if (e.button !== MOUSE.LEFT) return
      console.log('dragend')
      e.preventDefault()
      e.stopPropagation()
      if (activate && command) {
        const screen = getScreenSize()
        const position = { x: e.screenX, y: e.screenY }
        if (
          command.popupOption &&
          command.popupOption.width + position.x - screen.left > screen.width
        ) {
          position.x =
            screen.width - command.popupOption.width + screen.left - 1
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
      }
      setStartPosition(null)
      setDragPosition(null)
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

  return { progress, dragPosition }
}
