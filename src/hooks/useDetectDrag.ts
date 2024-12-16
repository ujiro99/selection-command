import { useState, useEffect } from 'react'
import { MOUSE, LINK_COMMAND_ENABLED } from '@/const'
import { Point, DragOption } from '@/types'
import { ExecState } from '@/action'
import { LinkPreview } from '@/action/linkPreview'
import { useSetting } from '@/hooks/useSetting'
import { DefaultCommands, PopupOption } from '@/services/defaultUserSettings'
import {
  isPopup,
  isAnchorElement,
  isClickableElement,
  isLinkCommand,
  getScreenSize,
} from '@/services/util'
import { sendEvent } from '@/services/analytics'

const isTargetEvent = (e: MouseEvent): boolean => {
  return (
    e.button === MOUSE.LEFT &&
    !isPopup(e.target as Element) &&
    (isAnchorElement(e.target as Element) ||
      isClickableElement(e.target as Element))
  )
}

const Default = DefaultCommands.find(isLinkCommand)
  ?.linkCommandOption as DragOption

export function useDetectDrag() {
  const [startPosition, setStartPosition] = useState<Point | null>()
  const [mousePosition, setMousePosition] = useState<Point | null>()
  const [target, setTarget] = useState<Element | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [activate, setActivate] = useState(false)
  const [progress, setProgress] = useState(0)
  const { settings, pageRule } = useSetting()
  const playPixel = 20
  const commandEnabled =
    pageRule == null ||
    pageRule.linkCommandEnabled == undefined ||
    pageRule.linkCommandEnabled === LINK_COMMAND_ENABLED.INHERIT
      ? settings.linkCommand.enabled === LINK_COMMAND_ENABLED.ENABLE
      : pageRule.linkCommandEnabled === LINK_COMMAND_ENABLED.ENABLE

  const command = settings.commands.find(isLinkCommand)
  const showIndicator =
    command?.linkCommandOption.showIndicator ?? Default.showIndicator
  const threshold = command?.linkCommandOption.threshold ?? Default.threshold

  const onChangeState = (state: ExecState, message?: string) => {
    console.debug({ state, message })
  }

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!isTargetEvent(e)) return
      setStartPosition({ x: e.clientX, y: e.clientY })
      setTarget(e.target as Element)
      e.stopPropagation()
      e.preventDefault()
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (e.button !== MOUSE.LEFT) return
      if (startPosition == null) return

      const current = { x: e.clientX, y: e.clientY }
      const distance = Math.sqrt(
        Math.pow(current.x - startPosition.x, 2) +
          Math.pow(current.y - startPosition.y, 2),
      )
      setMousePosition(current)
      setIsDetecting(showIndicator && distance > playPixel)
      setActivate(distance > threshold)
      setProgress(Math.min(Math.floor((distance / threshold) * 100), 100))
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button !== MOUSE.LEFT) return
      if (startPosition == null) return
      if (activate && command) {
        const h = command.popupOption?.height ?? PopupOption.height
        const w = command.popupOption?.width ?? PopupOption.width
        const screen = getScreenSize()
        const position = { x: e.screenX, y: e.screenY - 50 }
        position.x = Math.min(position.x, screen.width - w + screen.left)
        position.y = Math.min(position.y, screen.height - h + screen.top - 60)
        LinkPreview.execute({
          selectionText: '',
          command,
          position,
          useSecondary: false,
          changeState: onChangeState,
          target,
        })
        sendEvent('link_command', { id: 'link_preview' })
      }
      setStartPosition(null)
      setTarget(null)
      setMousePosition(null)
      setIsDetecting(false)
      setActivate(false)
    }

    if (commandEnabled) {
      window.addEventListener('mousedown', handleMouseDown)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('mousemove', handleMouseMove)
    }
    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [commandEnabled, startPosition, activate, command, target])

  return { progress, mousePosition, isDetecting }
}
