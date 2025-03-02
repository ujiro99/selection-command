import { useState, useEffect, useRef } from 'react'

import { Settings } from '@/services/settings'
import { capitalize } from '@/lib/utils'
import { APP_ID, VERSION } from '@/const'

import { Popup } from '@/components/Popup'
import { TableOfContents } from '@/components/option/TableOfContents'
import { ImportExport } from '@/components/option/ImportExport'
import { HubBanner } from '@/components/option/HubBanner'
import { SettingForm } from '@/components/option/SettingForm'

import css from './Option.module.css'

const SCROLL_OFFSET = 80

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
    const elm = document.querySelector(hash)
    if (elm != null) {
      const targetPosition =
        elm.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth',
      })
    }
  }

  return (
    <div>
      <header className={css.titleHeader}>
        <h1 className={css.title}>
          {APP_ID.split('-').map((n) => {
            return (
              <span key={n} className={css.titleSpan}>
                {capitalize(n)}
              </span>
            )
          })}
        </h1>
        <span className={css.version}>Version: {VERSION}</span>
      </header>
      <div className="flex m-auto gap-4 justify-center">
        <aside className="min-w-60">
          <div className="sticky top-20">
            <TableOfContents onClick={onClickMenu} />
            <ImportExport />
          </div>
        </aside>
        <main>
          <SettingForm className="pt-10" />
        </main>
        <aside className="pl-10 font-mono min-w-70">
          <div className="sticky top-20">
            <div
              ref={setPreviewElm}
              style={{ marginBottom: Math.max(popupHeight + 5, 30) }}
            >
              <Popup
                positionElm={previewElm}
                selectionText="preview"
                isPreview={true}
                ref={setPopupElm}
              />
            </div>
            <div className="pt-4">
              <HubBanner />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
