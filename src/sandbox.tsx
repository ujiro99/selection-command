import React from 'react'
import { createRoot } from 'react-dom/client'

import '@/components/global.css'
import { SettingFrom } from '@/components/option/SettingForm'
import icons from '../dist/icons.svg'

const dom = document.querySelector('#root')
if (dom != null) {
  const root = createRoot(dom)
  root.render(<SettingFrom />)

  // Putting icons.svg
  dom.insertAdjacentHTML('afterend', icons)
}
