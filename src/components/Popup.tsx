import React, { useState, useEffect } from 'react'
import { Popover, Transition } from '@headlessui/react'
import { usePopper } from 'react-popper'
import { popup, popupContianer } from './Popup.module.css'
import { Menu } from './Menu'
import { POPUP_ENABLED } from '../const'
import { useSetting } from '../hooks/useSetting'
import { Ipc, BgCommand } from '../services/ipc'

type PopupProps = {
  positionElm: Element | null
  selectionText: string
}

export function Popup(props: PopupProps) {
  const [popperElement, setPopperElement] = useState<HTMLDivElement>()
  const { settings, pageRule } = useSetting()
  const placement = settings.popupPlacement
  const isBottom = placement.startsWith('bottom')
  let enterFrom = 'pop-up-from'
  let enterTo = 'pop-up-to'
  if (isBottom) {
    enterFrom = 'pop-down-from'
    enterTo = 'pop-down-to'
  }

  const { styles, attributes } = usePopper(props.positionElm, popperElement, {
    placement: placement,
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, isBottom ? 0 : 8],
        },
      },
    ],
  })

  let visible = props.selectionText.length > 0 && props.positionElm != null
  if (pageRule != null) {
    visible = visible && pageRule.popupEnabled === POPUP_ENABLED.ENABLE
  }

  useEffect(() => {
    visible && Ipc.send(BgCommand.enableSidePanel)
  }, [visible])

  return (
    <Popover className={popupContianer}>
      <Transition
        show={visible}
        enter="transition duration-300 delay-250 ease-out"
        enterFrom={enterFrom}
        enterTo={enterTo}
      >
        <Popover.Panel
          ref={setPopperElement}
          style={styles.popper}
          {...attributes.popper}
          className={popup}
          static
        >
          <Menu />
        </Popover.Panel>
      </Transition>
    </Popover>
  )
}
