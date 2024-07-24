import React, { useState, useEffect } from 'react'
import { Popover, PopoverPanel, Transition } from '@headlessui/react'
import { useFloating, flip, autoUpdate } from '@floating-ui/react'
import { offset } from '@floating-ui/dom'
import { Menu } from './menu/Menu'
import { POPUP_ENABLED } from '../const'
import { useSetting } from '@/hooks/useSetting'
import { Ipc, BgCommand } from '@/services/ipc'
import { hexToHsl } from '@/services/util'

import { popup, popupContianer, popupTransition } from './Popup.module.css'

type PopupProps = {
  positionElm: Element | null
  selectionText: string
}

export function Popup(props: PopupProps) {
  const [forceHide, setForceHide] = useState(false)
  const { settings, pageRule } = useSetting()
  const placement = settings.popupPlacement
  const isBottom = placement.startsWith('bottom')
  const styles =
    settings.userStyles &&
    settings.userStyles.reduce((acc, cur) => {
      if (cur.value == null) return acc
      if (cur.name === 'background-color') {
        const hsl = hexToHsl(cur.value)
        return {
          ...acc,
          [`--${cur.name}`]: cur.value,
          '--background-color-h': `${hsl[0]}deg`,
          '--background-color-s': `${hsl[1]}%`,
          '--background-color-l': `${hsl[2]}%`,
        }
      }
      return { ...acc, [`--${cur.name}`]: cur.value }
    }, {})

  const { refs, floatingStyles } = useFloating({
    placement: placement,
    elements: { reference: props.positionElm },
    whileElementsMounted: autoUpdate,
    middleware: [
      isBottom ? offset(5) : offset(15),
      flip({
        fallbackPlacements: ['top', 'bottom'],
      }),
    ],
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
          <div className={`${popup} ${popupTransition}`} style={styles}>
            <Menu />
          </div>
        </PopoverPanel>
      </Transition>
    </Popover>
  )
}
