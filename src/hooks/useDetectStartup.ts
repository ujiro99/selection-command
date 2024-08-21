import { useState, useEffect, useRef } from 'react'
import type { PopupProps } from '@/components/Popup'
import { useSetting } from '@/hooks/useSetting'
import { POPUP_ENABLED, STARTUP_METHOD, KEYBOARD, MOUSE } from '@/const'
import { Ipc, TabCommand } from '@/services/ipc'

type Props = PopupProps

export function useDetectStartup(props: Props) {
  const { selectionText, positionElm, isPreview } = props
  const [hide, setHide] = useState(false)
  const [detectKey, setDetectKey] = useState(false)
  const { settings, pageRule } = useSetting()

  const startupMethod = settings.startupMethod

  let visible = selectionText.length > 0 && positionElm != null
  if (pageRule != null) {
    visible = visible && pageRule.popupEnabled === POPUP_ENABLED.ENABLE
  }
  visible = visible && !hide
  visible = visible || isPreview === true

  useEffect(() => {
    Ipc.addListener(TabCommand.closeMenu, () => {
      setHide(true)
      return false
    })
    return () => {
      Ipc.removeListener(TabCommand.closeMenu)
    }
  }, [])

  useEffect(() => {
    setHide(false)
    setDetectKey(false)
  }, [props.selectionText])

  // Keyboard
  useEffect(() => {
    if (startupMethod.method !== STARTUP_METHOD.KEYBOARD) {
      return
    }
    const detectKey = startupMethod.keyboardParam
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === detectKey) {
        setDetectKey((prev) => !prev)
      }
      // for Mac
      if (detectKey === KEYBOARD.CTRL && event.key === KEYBOARD.META) {
        setDetectKey((prev) => !prev)
      }
    }
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [startupMethod])

  if (startupMethod.method === STARTUP_METHOD.KEYBOARD) {
    visible = visible && detectKey
  }

  const detectHold = useLeftClickHold(props)
  if (startupMethod.method === STARTUP_METHOD.LEFT_CLICK_HOLD) {
    visible = visible && detectHold
  }

  const isContextMenu = startupMethod.method === STARTUP_METHOD.CONTEXT_MENU
  const isKeyboard = startupMethod.method === STARTUP_METHOD.KEYBOARD

  return { visible, isContextMenu, isKeyboard }
}

type useLeftClickHoldParam = {
  selectionText: string
}

export function useLeftClickHold(props: useLeftClickHoldParam) {
  const [detectHold, setDetectHold] = useState(false)
  const { settings } = useSetting()
  const startupMethod = settings.startupMethod
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    setDetectHold(false)
  }, [props.selectionText])

  // Left click hold
  useEffect(() => {
    if (startupMethod.method !== STARTUP_METHOD.LEFT_CLICK_HOLD) {
      return
    }
    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === MOUSE.LEFT) {
        if (detectHold) {
          // If already in hold, click to release hold.
          setDetectHold(false)
        } else if (props.selectionText) {
          // If there is a selection-text, start count of hold.
          timeoutRef.current = setTimeout(() => {
            setDetectHold(true)
          }, startupMethod.leftClickHoldParam)
        } else {
          setDetectHold(false)
        }
      }
    }
    const handleMouseUp = (event: MouseEvent) => {
      if (event.button === MOUSE.LEFT) {
        clearTimeout(timeoutRef.current)
      }
    }
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [startupMethod, detectHold, timeoutRef, props])

  return detectHold
}
