import { useState, useEffect, useRef } from 'react'

import { Settings } from '@/services/settings'
import { capitalize } from '@/lib/utils'
import { APP_ID, VERSION } from '@/const'

import { Popup } from '@/components/Popup'
import { ScrollArea } from '@/components/ui/scrollArea'
import { TableOfContents } from '@/components/option/TableOfContents'
import { ImportExport } from '@/components/option/ImportExport'
import { HubBanner } from '@/components/option/HubBanner'
import { SettingForm } from '@/components/option/SettingForm'

import css from './Option.module.css'

export function Option() {
  const [headerElm, setHeaderElm] = useState<HTMLHeadElement | null>(null)
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
    const headerHeight = headerElm?.offsetHeight
    if (elm != null && headerHeight != null) {
      const targetPosition =
        elm.getBoundingClientRect().top + window.pageYOffset - headerHeight
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth',
      })
    }
  }

  return (
    <div>
      <header className={css.titleHeader} ref={setHeaderElm}>
        <h1 className={css.title}>{capitalize(APP_ID.replace('-', ' '))}</h1>
        <span className={css.version}>Version: {VERSION}</span>
      </header>
      <div className="flex m-auto gap-12 justify-center">
        <aside className="pt-20">
          <TableOfContents onClick={onClickMenu} />
          <ImportExport />
        </aside>
        <main>
          <ScrollArea className="h-[100vh] px-6">
            <SettingForm className="pt-20" />
          </ScrollArea>
        </main>
        <aside className="pt-20 font-mono">
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
          <div className="mt-20">
            <HubBanner />
          </div>
        </aside>
      </div>
    </div>
  )
}
