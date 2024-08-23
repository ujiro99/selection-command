import { useState, useEffect, useRef } from 'react'
import type { PopupProps } from '@/components/Popup'
import { useSetting } from '@/hooks/useSetting'
import { POPUP_ENABLED, STARTUP_METHOD, KEYBOARD, MOUSE } from '@/const'
import { Ipc, TabCommand } from '@/services/ipc'

type Props = PopupProps

export function useDetectStartup(props: Props) {
  const { selectionText, positionElm, isPreview } = props
  const [hide, setHide] = useState(false)
  const { settings, pageRule } = useSetting()
  const { method } = settings.startupMethod

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
  }, [props.selectionText])

  const detectKey = useKeyboard(props)
  if (method === STARTUP_METHOD.KEYBOARD) {
    visible = visible && detectKey
  }

  const detectHold = useLeftClickHold(props)
  if (method === STARTUP_METHOD.LEFT_CLICK_HOLD) {
    visible = visible && detectHold
  }

  const isContextMenu = method === STARTUP_METHOD.CONTEXT_MENU
  const isKeyboard = method === STARTUP_METHOD.KEYBOARD
  const isLeftClickHold = method === STARTUP_METHOD.LEFT_CLICK_HOLD

  return { visible, isContextMenu, isKeyboard, isLeftClickHold }
}

export function useKeyboard(props: Props) {
  const { settings } = useSetting()
  const [detectKey, setDetectKey] = useState(false)
  const { method, keyboardParam } = settings.startupMethod

  useEffect(() => {
    setDetectKey(false)
  }, [props.selectionText])

  useEffect(() => {
    if (method !== STARTUP_METHOD.KEYBOARD) {
      return
    }
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === keyboardParam) {
        setDetectKey((prev) => !prev)
      }
      // for Mac
      if (keyboardParam === KEYBOARD.CTRL && event.key === KEYBOARD.META) {
        setDetectKey((prev) => !prev)
      }
    }
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [method, keyboardParam])

  return detectKey
}

type useLeftClickHoldParam = {
  selectionText: string
}
export function useLeftClickHold(props: useLeftClickHoldParam) {
  const [detectHold, setDetectHold] = useState(false)
  const { settings } = useSetting()
  const { method, leftClickHoldParam } = settings.startupMethod
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    setDetectHold(false)
  }, [props.selectionText])

  // Left click hold
  useEffect(() => {
    if (method !== STARTUP_METHOD.LEFT_CLICK_HOLD) {
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
          }, leftClickHoldParam)
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
  }, [method, leftClickHoldParam, detectHold, timeoutRef, props])

  return detectHold
}
