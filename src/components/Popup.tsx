import React, { useState, useRef } from 'react'
import { Popover, Transition } from '@headlessui/react'
import { usePopper } from 'react-popper'
import { popup } from './Popup.module.css'

type PopupProps = {
  positionElm: Element | null
  selectionText: string
}

export function Popup(props: PopupProps): JSX.Element {
  const [popperElement, setPopperElement] = useState<HTMLDivElement>()
  const nodeRef = useRef(null)
  const { styles, attributes } = usePopper(props.positionElm, popperElement, {
    placement: 'top-end',
  })
  let visible = props.selectionText.length > 0 && props.positionElm != null

  return (
    <Popover>
      <Transition
        show={visible}
        enter="transition duration-400 delay-300 ease-out"
        enterFrom="transform popup-from opacity-0"
        enterTo="transform popup-to opacity-100"
        leave="transition duration-75 ease-out"
        leaveFrom="transform scale-100 opacity-100"
        leaveTo="transform scale-95 opacity-0"
      >
        <Popover.Panel
          ref={setPopperElement}
          style={styles.popper}
          {...attributes.popper}
          static
        >
          <div ref={nodeRef} className={popup}>
            {props.selectionText}
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  )
}
