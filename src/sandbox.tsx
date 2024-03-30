import React from 'react'
import { createRoot } from 'react-dom/client'
import { SettingFrom } from './components/SettingForm'
import icons from '../dist/icons.svg'

const dom = document.querySelector('#root')
if (dom != null) {
  const root = createRoot(dom)
  root.render(<SettingFrom />)

  // Putting icons.svg
  dom.insertAdjacentHTML('afterend', icons)
}

// start observing a DOM node to notify a height of iframe.
const resizeObserver = new ResizeObserver((entries) => {
  const height = entries[0].target.scrollHeight
  window.parent.postMessage(
    {
      command: 'setHeight',
      value: height + 20,
    },
    '*',
  )
})
resizeObserver.observe(document.body)
