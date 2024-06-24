import React, { useState, useEffect } from 'react'
import { Popover, PopoverPanel, Transition } from '@headlessui/react'
import { useFloating } from '@floating-ui/react'
import { offset } from '@floating-ui/dom'
import { popup, popupContianer } from './Popup.module.css'
import { Menu } from './menu/Menu'
import { POPUP_ENABLED } from '../const'
import { useSetting } from '@/hooks/useSetting'
import { Ipc, BgCommand } from '@/services/ipc'

type PopupProps = {
  positionElm: Element | null
  selectionText: string
}

export function Popup(props: PopupProps) {
  const [forceHide, setForceHide] = useState(false)
  const { settings, pageRule } = useSetting()
  const placement = settings.popupPlacement
  const isBottom = placement.startsWith('bottom')

  const { refs, floatingStyles } = useFloating({
    placement: placement,
    elements: { reference: props.positionElm },
    middleware: [isBottom ? offset(0) : offset(15)],
  })

  let visible = props.selectionText.length > 0 && props.positionElm != null
  if (pageRule != null) {
    visible = visible && pageRule.popupEnabled === POPUP_ENABLED.ENABLE
  }
  visible = visible && !forceHide

  useEffect(() => {
    Ipc.addListener(BgCommand.closeMenu, () => {
      setForceHide(true)
      return false
    })
  }, [])

  useEffect(() => {
    setForceHide(false)
  }, [props.selectionText])

  return (
    <Popover className={popupContianer}>
      <Transition show={visible}>
        <PopoverPanel
          ref={refs.setFloating}
          style={floatingStyles}
          data-placement={placement}
          static
        >
          <div className={`${popup} transition`}>
            <Menu />
          </div>
        </PopoverPanel>
      </Transition>
    </Popover>
  )
}
