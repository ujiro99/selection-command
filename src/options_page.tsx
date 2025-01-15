import React from 'react'
import ReactDOM from 'react-dom/client'
import { Option } from '@/components/option/Option'
import icons from './icons.svg?raw'

import '@/components/global.css'
import '@/components/Animation.css'

const root = document.getElementById('root')
if (root) {
  root.insertAdjacentHTML('afterend', icons)
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <Option />
    </React.StrictMode>,
  )
}
