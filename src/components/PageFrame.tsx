import React, { useState } from 'react'
import { Popover, Transition } from '@headlessui/react'
import { usePopper } from 'react-popper'
import { page, iframe } from './PageFrame.module.css'

type PageFrameProps = {
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
    <Popover>
      <Transition
        show={true}
        enter="transition duration-300 ease-out"
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
          <div className={page + ' shadow-xl'}>
            <iframe className={iframe} src={props.url}></iframe>
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  )
}
