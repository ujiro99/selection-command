import { useState, useEffect } from 'react'

import { Settings } from '@/services/settings'
import { capitalize } from '@/lib/utils'
import { APP_ID, VERSION } from '@/const'

import { Popup } from '@/components/Popup'
import { TableOfContents } from '@/components/option/TableOfContents'
import { ImportExport } from '@/components/option/ImportExport'
import { HubBanner } from '@/components/option/HubBanner'
import { SettingForm } from '@/components/option/SettingForm'

import css from './Option.module.css'

export function Option() {
  const [previewElm, setPreviewElm] = useState<Element | null>(null)
  const [popupElm, setPopupElm] = useState<Element | null>(null)
  const [popupHeight, setPopupHeight] = useState(0)

  useEffect(() => {
    const updateHeight = () => {
      if (popupElm == null) return
      setTimeout(() => {
        const rect = popupElm.getBoundingClientRect()
        setPopupHeight(rect.height)
      }, 40)
    }
    Settings.addChangedListener(updateHeight)
    updateHeight()
    return () => {
      Settings.removeChangedListener(updateHeight)
    }
  }, [popupElm])

  const onClickMenu = (hash: string) => {
    if (!hash) return
    const menu = document.querySelector(hash)
    menu?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className={css.option}>
      <div className={css.rightColumn}>
        <div
          ref={setPreviewElm}
          style={{ marginBottom: Math.max(popupHeight, 30) }}
        >
          <Popup
            positionElm={previewElm}
            selectionText="preview"
            isPreview={true}
            ref={setPopupElm}
          />
        </div>
        <div className="mt-8">
          <HubBanner />
        </div>
      </div>

      <div className={css.menuContainer}>
        <TableOfContents onClick={onClickMenu} />
        <ImportExport />
      </div>

      <header className={css.titleHeader}>
        <h1 className={css.title}>{capitalize(APP_ID.replace('-', ' '))}</h1>
        <span className={css.version}>Version: {VERSION}</span>
      </header>

      <SettingForm />
    </div>
  )
}
