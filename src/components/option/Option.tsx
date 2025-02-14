import { useState, useEffect, useRef } from 'react'

import { Settings } from '@/services/settings'
import type { SettingsType } from '@/types'
import { sleep, capitalize, isMenuCommand, isLinkCommand } from '@/lib/utils'
import { fetchIconUrl } from '@/services/chrome'
import { APP_ID, VERSION, OPTION_MSG } from '@/const'

import { Popup } from '@/components/Popup'
import { TableOfContents } from '@/components/option/TableOfContents'
import { ImportExport } from '@/components/option/ImportExport'
import { HubBanner } from '@/components/option/HubBanner'
import { SettingForm } from '@/components/option/SettingForm'
import { useEventProxyReceiver } from '@/hooks/option/useEventProxy'

import css from './Option.module.css'

export function Option() {
  const [previewElm, setPreviewElm] = useState<Element | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const iframeTORef = useRef<number>(0)
  const [popupElm, setPopupElm] = useState<Element | null>(null)
  const [popupHeight, setPopupHeight] = useState(0)

  useEventProxyReceiver()

  useEffect(() => {
    const func = async (event: MessageEvent) => {
      const command = event.data.command
      const value = event.data.value
      switch (command) {
        case OPTION_MSG.START_ACK:
          clearInterval(iframeTORef.current)
          break
        case OPTION_MSG.FETCH_ICON_URL:
          const { searchUrl } = value
          console.debug('fetchIconUrl', searchUrl)
          try {
            const iconUrl = await fetchIconUrl(searchUrl)
            sendMessage(OPTION_MSG.RES_FETCH_ICON_URL, { searchUrl, iconUrl })
          } catch (e) {
            console.warn('Failed to fetch icon', searchUrl)
            sendMessage(OPTION_MSG.RES_FETCH_ICON_URL, {
              searchUrl,
              iconUrl: null,
            })
          }
          break
        case OPTION_MSG.OPEN_LINK:
          window.open(value, '_blank')
          break
        default:
          break
      }
    }
    window.addEventListener('message', func)
    return () => {
      window.removeEventListener('message', func)
    }
  }, [])

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

  const sendMessage = (command: OPTION_MSG, value: unknown) => {
    if (iframeRef.current != null && iframeRef.current.contentWindow != null) {
      const message = { command, value }
      iframeRef.current.contentWindow.postMessage(message, '*')
    } else {
      console.warn('frame null')
      console.warn(iframeRef)
    }
  }

  // const onLoadIframe = async () => {
  //   const settings = await Settings.get(true)
  //   const translation = getTranslation()

  //   // Convert linkCommand option
  //   const linkCommands = settings.commands.filter(isLinkCommand)
  //   if (linkCommands.length > 0) {
  //     const linkCommand = linkCommands[0]
  //     settings.linkCommand = {
  //       ...settings.linkCommand,
  //       openMode: linkCommand.openMode,
  //     }
  //   }
  //   settings.commands = settings.commands.filter(isMenuCommand)

  // }

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
