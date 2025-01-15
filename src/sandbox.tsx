import React from 'react'
import ReactDOM from 'react-dom/client'
import '@/components/global.css'
import { SettingFrom } from '@/components/option/SettingForm'
import icons from './icons.svg?raw'

const root = document.getElementById('root')
if (root) {
  root.insertAdjacentHTML('afterend', icons)
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <SettingFrom />
    </React.StrictMode>,
  )
}
