import React, { useState } from 'react'
import { Popover, Transition } from '@headlessui/react'
import { usePopper } from 'react-popper'
import { page, iframe } from './PageFrame.module.css'

type PageFrameProps = {
  visible: boolean
  positionElm: Element | null
  url: string
}

export function PageFrame(props: PageFrameProps): JSX.Element {
  const [popperElement, setPopperElement] = useState<HTMLDivElement>()
  const { styles, attributes } = usePopper(props.positionElm, popperElement, {
    placement: 'right-start',
  })

  if (props.positionElm == null) {
    return <></>
  }

  return (
    <Popover className="page-frame">
      <Transition
        show={props.visible}
        enter="collapse-wrap"
        enterFrom="collapse-from"
        enterTo="collapse-to"
      >
        <Popover.Panel
          ref={setPopperElement}
          style={styles.popper}
          {...attributes.popper}
          static
        >
          <div className={page + ' shadow-xl'}>
            <iframe className={iframe} src={props.url}></iframe>
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  )
}
