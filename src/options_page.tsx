import React from 'react'
import { createRoot } from 'react-dom/client'
import { Option } from './components/Option'

const dom = document.querySelector('#root')
if (dom != null) {
  const root = createRoot(dom)
  root.render(<Option />)
}
