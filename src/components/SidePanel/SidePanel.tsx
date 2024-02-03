import React, { useState, useEffect } from 'react'
import { Ipc, SidePanelCommand } from '../../services/ipc'

import css from './SidePanel.module.css'

export function SidePanel() {
  const [url, setUrl] = useState('')

  useEffect(() => {
    Ipc.addListener(SidePanelCommand.setUrl, (param: unknown) => {
      const { url } = param
      setUrl(url)
      return false
    })
    Ipc.send(SidePanelCommand.onLoad)
  }, [])

  return (
    <div className={css.sidepanel}>
      <iframe id="iframe" className={css.frame} src={url} />
    </div>
  )
}
