import * as mv3 from 'mv3-hot-reload'
import { Option } from './components/Option'
mv3.content.init()

import React from 'react'
import { createRoot } from 'react-dom/client'

const dom = document.querySelector('#root')
if (dom != null) {
  const root = createRoot(dom)
  root.render(<Option />)
}
