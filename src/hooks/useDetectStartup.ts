import { useState, useEffect } from 'react'
import type { PopupProps } from '@/components/Popup'
import { useSetting } from '@/hooks/useSetting'
import { POPUP_ENABLED, STARTUP_METHOD } from '@/const'
import { Ipc, TabCommand } from '@/services/ipc'

type Props = PopupProps

export function useDetectStartup(props: Props) {
  const [hide, setHide] = useState(false)
  const { settings, pageRule } = useSetting()
  const { selectionText, positionElm, isPreview } = props

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

  let isContextMenu =
    settings.startupMethod.method === STARTUP_METHOD.CONTEXT_MENU

  return { visible, isContextMenu }
}
