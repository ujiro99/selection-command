import { useState, useEffect } from 'react'
import type { PopupProps } from '@/components/Popup'
import { useSetting } from '@/hooks/useSetting'
import { useLeftClickHold } from '@/hooks/useLeftClickHold'
import { POPUP_ENABLED, STARTUP_METHOD, KEYBOARD } from '@/const'
import { Ipc, TabCommand } from '@/services/ipc'

type Props = PopupProps & {
  isHover?: boolean
}

export function useDetectStartup(props: Props) {
  const { selectionText, positionElm, isPreview, isHover } = props
  const [hide, setHide] = useState(false)
  const { settings, pageRule } = useSetting()
  const { method, leftClickHoldParam } = settings.startupMethod

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

  const { detectHold } = useLeftClickHold({
    enable: method === STARTUP_METHOD.LEFT_CLICK_HOLD,
    holdDuration: leftClickHoldParam ?? 200,
    selectionText,
  })
  if (method === STARTUP_METHOD.LEFT_CLICK_HOLD) {
    visible = visible && detectHold
  }

  visible = visible || isHover === true

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
