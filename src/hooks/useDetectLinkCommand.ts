import { useState, useEffect, useRef } from 'react'
import {
  MOUSE,
  KEYBOARD,
  LINK_COMMAND_ENABLED,
  LINK_COMMAND_STARTUP_METHOD,
  POPUP_OFFSET,
  ExecState,
} from '@/const'
import { Point, SettingsType, Command } from '@/types'
import { LinkPreview } from '@/action/linkPreview'
import { useSetting } from '@/hooks/useSetting'
import { useLeftClickHold } from '@/hooks/useLeftClickHold'
import Default, { PopupOption } from '@/services/option/defaultSettings'
import { isPopup, isLinkCommand, isMac } from '@/lib/utils'
import {
  isClickableElement,
  findAnchorElement,
  ScreenSize,
} from '@/services/dom'
import { getScreenSize } from '@/services/screen'
import { sendEvent, ANALYTICS_EVENTS } from '@/services/analytics'

const isTargetEvent = (e: MouseEvent): boolean => {
  return (
    e.button === MOUSE.LEFT &&
    !isPopup(e.target as Element) &&
    (findAnchorElement(e) != null || isClickableElement(e.target as Element))
  )
}

type DetectLinkCommandReturn = {
  inProgress: boolean
  progress: number
  mousePosition: Point | null
  showIndicator: boolean
  detectDrag?: boolean
  preventLinkClick?: boolean
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
    sendEvent(ANALYTICS_EVENTS.LINK_COMMAND, { id: 'link_preview' })
  }

  return {
    showIndicator,
    ...empty,
    ...useDetectDrag(enabled, settings, command, onDetect),
    ...useDetectKeyboard(enabled, settings, command, onDetect),
    ...useDetectClickHold(enabled, settings, command, onDetect),
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
    if (!dragEnabled) return

    const handleMouseDown = (e: MouseEvent) => {
      if (!isTargetEvent(e)) return
      setStartPosition({ x: e.clientX, y: e.clientY })
      const t = findAnchorElement(e) ?? e.target
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

    const handleMouseUp = async (e: MouseEvent) => {
      if (e.button !== MOUSE.LEFT) return
      if (startPosition == null) return
      if (activate && command) {
        const h = command.popupOption?.height ?? PopupOption.height
        const w = command.popupOption?.width ?? PopupOption.width
        const screen = await getScreenSize()
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

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [dragEnabled, startPosition, activate, command, target, onDetect])

  return dragEnabled
    ? { progress, mousePosition, inProgress, detectDrag: true }
    : {}
}

const isCursorInLeft = (cursorX: number, s: ScreenSize): boolean => {
  return cursorX < s.width / 2
}

const calcPopupPosition = async (
  cursorX: number,
  command: Command,
): Promise<Point> => {
  const popupOption = command?.popupOption ?? PopupOption
  const s = await getScreenSize()
  const x = isCursorInLeft(cursorX, s)
    ? Math.floor(s.width + s.left - popupOption.width - POPUP_OFFSET)
    : Math.floor(s.left + POPUP_OFFSET)
  const y = Math.floor((s.height + s.top - popupOption.height) / 2)
  return { x, y }
}

const checkValidKey = (key: string | undefined, e: MouseEvent): boolean => {
  let detect = false
  key === KEYBOARD.SHIFT && e.shiftKey && (detect = true)
  key === KEYBOARD.CTRL && e.ctrlKey && (detect = true)
  key === KEYBOARD.ALT && e.altKey && (detect = true)
  key === KEYBOARD.META && e.metaKey && (detect = true)
  if (isMac()) {
    key === KEYBOARD.CTRL && e.metaKey && (detect = true)
  }
  return detect
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
  const [target, setTarget] = useState<Element | null>(null)
  const [mousePosition, setMousePosition] = useState<Point | null>(null)
  const [mousePress, setMousePress] = useState<boolean>(false)

  useEffect(() => {
    if (!keyboardEnabled) return

    const onMouseDown = (e: MouseEvent) => {
      if (!keyboardEnabled) return
      if (!isTargetEvent(e)) return
      if (!checkValidKey(key, e)) return
      setTarget(e.target as Element)
      setMousePosition({ x: e.clientX, y: e.clientY })
      setMousePress(true)
    }

    const onMouseUp = () => {
      setTimeout(() => {
        setTarget(null)
        setMousePosition(null)
        setMousePress(false)
      }, 200)
    }

    const onClick = async (e: MouseEvent) => {
      if (!keyboardEnabled) return
      if (!checkValidKey(key, e)) return
      if (target == null) return
      const pos = await calcPopupPosition(e.clientX, command)
      onDetect(pos, target as Element)
    }

    window.addEventListener('click', onClick)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('click', onClick)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [keyboardEnabled, key, onDetect, popupOption])

  return keyboardEnabled
    ? {
        progress: 0,
        mousePosition,
        inProgress: mousePress,
        preventLinkClick: true,
      }
    : {}
}

function useDetectClickHold(
  enabled: boolean,
  settings: SettingsType,
  command: Command,
  onDetect: OnDetect,
): SubHookReturn {
  const clickHoldEnabled =
    enabled &&
    settings.linkCommand.startupMethod.method ===
      LINK_COMMAND_STARTUP_METHOD.LEFT_CLICK_HOLD
  const duration = settings.linkCommand.startupMethod.leftClickHoldParam ?? 200
  const detectLinkRef = useRef(false)
  const [forceClear, setForceClear] = useState(false)
  const playPixel = 20

  const { detectHoldLink, position, progress, linkElement } = useLeftClickHold({
    enable: clickHoldEnabled && !forceClear,
    holdDuration: duration,
  })

  const clear = () => {
    setForceClear(true)
    setTimeout(() => setForceClear(false), 100)
  }

  useEffect(() => {
    if (clickHoldEnabled && detectHoldLink) {
      calcPopupPosition(position.x, command).then((pos) =>
        onDetect(pos, linkElement as Element),
      )
    }
  }, [clickHoldEnabled, detectHoldLink])

  useEffect(() => {
    if (!clickHoldEnabled) return
    const handleMouseDown = (e: MouseEvent) => {
      if (!isTargetEvent(e)) return
      detectLinkRef.current = true
    }
    const handleMouseUp = () => {
      if (!detectLinkRef.current) return
      detectLinkRef.current = false
      clear()
    }

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [clickHoldEnabled])

  return clickHoldEnabled && detectLinkRef.current
    ? {
        mousePosition: position,
        inProgress: progress > playPixel,
        progress: progress,
        preventLinkClick: detectHoldLink,
      }
    : {}
}
