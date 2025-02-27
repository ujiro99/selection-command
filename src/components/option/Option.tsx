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

const SCROLL_OFFSET = 96

export function Option() {
  const [previewElm, setPreviewElm] = useState<Element | null>(null)
  const [popupElm, setPopupElm] = useState<Element | null>(null)
  const [popupHeight, setPopupHeight] = useState(0)
  const formRef = useRef<HTMLDivElement>(null)

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
    if (elm != null && formRef.current != null) {
      const targetPosition =
        elm.getBoundingClientRect().top +
        formRef.current.scrollTop -
        SCROLL_OFFSET
      formRef.current?.scrollTo({
        top: targetPosition,
        behavior: 'smooth',
      })
    }
  }

  return (
    <div>
      <header className={css.titleHeader}>
        <h1 className={css.title}>{capitalize(APP_ID.replace('-', ' '))}</h1>
        <span className={css.version}>Version: {VERSION}</span>
      </header>
      <div className="flex m-auto gap-4 justify-center">
        <aside className="pt-24 min-w-64">
          <TableOfContents onClick={onClickMenu} />
          <ImportExport />
        </aside>
        <main>
          <ScrollArea className="h-[100vh] px-6" ref={formRef}>
            <SettingForm className="pt-24" />
          </ScrollArea>
        </main>
        <aside className="pl-10 pt-24 font-mono min-w-70">
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
        </aside>
      </div>
    </div>
  )
}
