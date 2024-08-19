import { useState, useEffect } from 'react'
import type { PopupProps } from '@/components/Popup'
import { useSetting } from '@/hooks/useSetting'
import { POPUP_ENABLED, STARTUP_METHOD, KEYBOARD } from '@/const'
import { Ipc, TabCommand } from '@/services/ipc'

type Props = PopupProps

export function useDetectStartup(props: Props) {
  const [hide, setHide] = useState(false)
  const [detectKey, setDetectKey] = useState(false)
  const { settings, pageRule } = useSetting()
  const { selectionText, positionElm, isPreview } = props
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

  useEffect(() => {
    if (startupMethod.method !== STARTUP_METHOD.KEYBOARD) {
      return
    }
    const detectKey = startupMethod.keyboardParam
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === detectKey) {
        setDetectKey((prev) => !prev)
      }
      // for Mac
      if (detectKey === KEYBOARD.CTRL && event.key === KEYBOARD.META) {
        setDetectKey((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [startupMethod])

  if (startupMethod.method === STARTUP_METHOD.KEYBOARD) {
    visible = visible && detectKey
  }

  let isContextMenu =
    settings.startupMethod.method === STARTUP_METHOD.CONTEXT_MENU

  return { visible, isContextMenu }
}
