import React, { useState, useRef } from 'react'
import { Popover } from '@headlessui/react'
import { CSSTransition } from 'react-transition-group'
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
      {visible && (
        <CSSTransition in={visible} timeout={200} classNames="fade">
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
        </CSSTransition>
      )}
    </Popover>
  )
}
