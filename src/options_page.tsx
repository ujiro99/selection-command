import React from 'react'
import ReactDOM from 'react-dom/client'
import { Option } from '@/components/option/Option'
import icons from './icons.svg?raw'
import { getCurrentLocale } from '@/services/i18n'

import '@/components/global.css'
import '@/components/Animation.css'

// Set the document language to the current locale
document.documentElement.lang = getCurrentLocale()

const root = document.getElementById('root')
if (root) {
  root.insertAdjacentHTML('afterend', icons)
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <Option />
    </React.StrictMode>,
  )
}
