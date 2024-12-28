import { useState, useEffect } from 'react'
import {
  MOUSE,
  KEYBOARD,
  LINK_COMMAND_ENABLED,
  LINK_COMMAND_STARTUP_METHOD,
  POPUP_OFFSET,
} from '@/const'
import { Point, SettingsType, Command } from '@/types'
import { ExecState } from '@/action'
import { LinkPreview } from '@/action/linkPreview'
import { useSetting } from '@/hooks/useSetting'
import Default, { PopupOption } from '@/services/defaultSettings'
import { isPopup, isLinkCommand, isMac } from '@/lib/utils'
import {
  getScreenSize,
  isAnchorElementFromPoint,
  isClickableElement,
  findAnchorElementFromPoint,
  ScreenSize,
} from '@/services/dom'
import { sendEvent } from '@/services/analytics'

const isTargetEvent = (e: MouseEvent): boolean => {
  return (
    e.button === MOUSE.LEFT &&
    !isPopup(e.target as Element) &&
    (isAnchorElementFromPoint({ x: e.clientX, y: e.clientY }) ||
      isClickableElement(e.target as Element))
  )
}

type DetectLinkCommandReturn = {
  inProgress: boolean
  progress: number
  mousePosition: Point | null
  showIndicator: boolean
}

type SubHookReturn = Omit<DetectLinkCommandReturn, 'showIndicator'> | {}

const empty = {
  inProgress: false,
  progress: 0,
  mousePosition: null,
}

export function useDetectLinkCommand(): DetectLinkCommandReturn {
  const { settings, pageRule } = useSetting()
  const showIndicator = settings.linkCommand.showIndicator
  const command = settings.commands.find(isLinkCommand) as Command
  const enabled =
    pageRule == null ||
    pageRule.linkCommandEnabled == undefined ||
    pageRule.linkCommandEnabled === LINK_COMMAND_ENABLED.INHERIT
      ? settings.linkCommand.enabled === LINK_COMMAND_ENABLED.ENABLE
      : pageRule.linkCommandEnabled === LINK_COMMAND_ENABLED.ENABLE

  console.log(' 9', { linkCommand: settings.linkCommand })

  const onChangeState = (state: ExecState, message?: string) => {
    console.debug({ state, message })
  }

  const onDetect = (position: Point, target: Element) => {
    if (command == null) return
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

  return {
    showIndicator,
    ...empty,
    ...useDetectDrag(enabled, settings, command, onDetect),
    ...useDetectKeyboard(enabled, settings, command, onDetect),
  }
}

type OnDetect = (position: Point, target: Element) => void

function useDetectDrag(
  enabled: boolean,
  settings: SettingsType,
  command: Command,
  onDetect: OnDetect,
): SubHookReturn {
  const [startPosition, setStartPosition] = useState<Point | null>(null)
  const [mousePosition, setMousePosition] = useState<Point | null>(null)
  const [target, setTarget] = useState<Element | null>(null)
  const [inProgress, setInProgress] = useState(false)
  const [activate, setActivate] = useState(false)
  const [progress, setProgress] = useState(0)
  const playPixel = 20

  const dragEnabled =
    enabled &&
    settings.linkCommand.startupMethod.method ===
      LINK_COMMAND_STARTUP_METHOD.DRAG

  const threshold =
    settings.linkCommand.startupMethod.threshold ??
    (Default.linkCommand.startupMethod.threshold as number)

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!isTargetEvent(e)) return
      setStartPosition({ x: e.clientX, y: e.clientY })
      const t =
        findAnchorElementFromPoint({ x: e.clientX, y: e.clientY }) ?? e.target
      setTarget(t as Element)
      // Prevent text selection during drag
      if (isClickableElement(e.target as HTMLElement)) {
        e.preventDefault()
      }
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
      setInProgress(distance > playPixel)
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
        onDetect(position, target as Element)
      }
      setStartPosition(null)
      setTarget(null)
      setMousePosition(null)
      setInProgress(false)
      setActivate(false)
    }

    if (dragEnabled) {
      window.addEventListener('mousedown', handleMouseDown)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('mousemove', handleMouseMove)
    }
    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [dragEnabled, startPosition, activate, command, target, onDetect])

  return dragEnabled ? { progress, mousePosition, inProgress } : {}
}

const isCursorInLeft = (e: MouseEvent, s: ScreenSize): boolean => {
  return e.screenX < s.width / 2
}

function useDetectKeyboard(
  enabled: boolean,
  settings: SettingsType,
  command: Command,
  onDetect: OnDetect,
): SubHookReturn {
  const keyboardEnabled =
    enabled &&
    settings.linkCommand.startupMethod.method ===
      LINK_COMMAND_STARTUP_METHOD.KEYBOARD
  const key = settings.linkCommand.startupMethod.keyboardParam
  const popupOption = command?.popupOption ?? PopupOption
  const [mousePosition, setMousePosition] = useState<Point | null>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!isTargetEvent(e)) return
      if (!keyboardEnabled) return

      let detect = false
      key === KEYBOARD.SHIFT && e.shiftKey && (detect = true)
      key === KEYBOARD.CTRL && e.ctrlKey && (detect = true)
      key === KEYBOARD.ALT && e.altKey && (detect = true)
      key === KEYBOARD.META && e.metaKey && (detect = true)
      if (isMac()) {
        key === KEYBOARD.CTRL && e.metaKey && (detect = true)
      }
      if (!detect) return

      const s = getScreenSize()
      let x = isCursorInLeft(e, s)
        ? Math.floor(s.width + s.left - popupOption.width - POPUP_OFFSET)
        : Math.floor(s.left + POPUP_OFFSET)
      const y = Math.floor((s.height + s.top - popupOption.height) / 2)
      const pos = { x, y }

      setMousePosition(pos)
      onDetect(pos, e.target as Element)
      e.preventDefault()
    }

    if (keyboardEnabled) {
      window.addEventListener('click', onClick)
    }
    return () => {
      window.removeEventListener('click', onClick)
    }
  }, [keyboardEnabled, key, onDetect, popupOption])

  return keyboardEnabled
    ? { progress: 0, mousePosition, inProgress: false }
    : {}
}
