import React from 'react'
import { createRoot } from 'react-dom/client'
import { SidePanel } from './components/SidePanel/SidePanel'

const dom = document.querySelector('#root')
if (dom != null) {
  const root = createRoot(dom)
  root.render(<SidePanel />)
}
