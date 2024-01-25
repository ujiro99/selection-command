import React, { useState } from 'react'
import { Popover, Transition } from '@headlessui/react'
import { usePopper } from 'react-popper'
import { popup, popupContianer } from './Popup.module.css'
import { Menu } from './Menu'
import { POPUP_ENABLED } from '../const'
import { useSetting } from '../hooks/useSetting'

type PopupProps = {
  positionElm: Element | null
  selectionText: string
}

export function Popup(props: PopupProps) {
  const { settings, pageRule } = useSetting()
  const placement = settings.popupPlacement

  const [popperElement, setPopperElement] = useState<HTMLDivElement>()
  const { styles, attributes } = usePopper(props.positionElm, popperElement, {
    placement: placement,
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, 10],
        },
      },
    ],
  })

  let visible = props.selectionText.length > 0 && props.positionElm != null
  if (pageRule != null) {
    visible = visible && pageRule.popupEnabled === POPUP_ENABLED.ENABLE
    console.debug('visible', visible, pageRule.popupEnabled)
  }

  return (
    <Popover className={popupContianer}>
      <Transition
        show={visible}
        enter="transition duration-300 delay-300 ease-out"
        enterFrom="popup-from opacity-0"
        enterTo="popup-to opacity-100"
        leave="transition duration-100 ease-out"
        leaveFrom="popup-to opacity-100"
        leaveTo="popup-from opacity-0"
      >
        <Popover.Panel
          ref={setPopperElement}
          style={styles.popper}
          {...attributes.popper}
          className={popup + ' shadow-xl'}
          static
        >
          <Menu selectionText={props.selectionText} />
        </Popover.Panel>
      </Transition>
    </Popover>
  )
}
