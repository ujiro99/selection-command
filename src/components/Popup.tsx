import React, { useState } from 'react'
import { Popover, Transition } from '@headlessui/react'
import { usePopper } from 'react-popper'
import { popup, popupContianer } from './Popup.module.css'
import { Menu } from './Menu'

type PopupProps = {
  positionElm: Element | null
  selectionText: string
}

export function Popup(props: PopupProps): JSX.Element {
  const [popperElement, setPopperElement] = useState<HTMLDivElement>()
  const { styles, attributes } = usePopper(props.positionElm, popperElement, {
    placement: 'top-start',
  })
  let visible = props.selectionText.length > 0 && props.positionElm != null

  const sidePanel = async () => {
    return await chrome.runtime.sendMessage({ command: 'openSidePanel' })
  }

  return (
    <Popover className={popupContianer}>
      <Transition
        show={visible}
        enter="transition duration-300 delay-300 ease-out"
        enterFrom="transform popup-from opacity-0"
        enterTo="transform popup-to opacity-100"
        leave="transition duration-100 ease-out"
        leaveFrom="transform popup-to opacity-100"
        leaveTo="transform popup-from opacity-0"
      >
        <Popover.Panel
          ref={setPopperElement}
          style={styles.popper}
          {...attributes.popper}
          static
        >
          <div className={popup + ' shadow-xl'}>
            <Menu selectionText={props.selectionText} />
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  )
}
