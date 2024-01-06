import * as mv3 from 'mv3-hot-reload'
mv3.content.init()
import * as React from 'react'
const useState = React.useState
import { createRoot } from 'react-dom/client'
import { Popover } from '@headlessui/react'
import { usePopper } from 'react-popper'

import { popup } from './app.module.css'

const rootDom = document.createElement('div')
rootDom.id = 'selection-popup'
document.body.append(rootDom)
const shadowOpen = rootDom.attachShadow({ mode: 'open' })
const root = createRoot(shadowOpen)
root.render(<App />)

document.addEventListener('selectionchange', () => {
  const selection = document.getSelection()
  if (selection == null) {
    return
  }
  const str = selection.toString()
  console.log('change', str.length, str)
})

function App() {
  let [referenceElement, setReferenceElement] = useState()
  let [popperElement, setPopperElement] = useState()
  let { styles, attributes } = usePopper(referenceElement, popperElement)

  return (
    <Popover>
      {({ open }) => (
        <>
          <Popover.Button>Solutions</Popover.Button>
          {open && (
            <Popover.Panel
              ref={setPopperElement}
              style={styles.popper}
              {...attributes.popper}
              static
            >
              <p className={popup}>popup content</p>
            </Popover.Panel>
          )}
        </>
      )}
    </Popover>
  )
}
