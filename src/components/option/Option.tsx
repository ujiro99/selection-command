import { useState, useEffect, useRef } from 'react'
import { CSSTransition } from 'react-transition-group'

import { Settings } from '@/services/settings'
import type { SettingsType } from '@/types'
import { sleep, capitalize, isMenuCommand, isLinkCommand } from '@/lib/utils'
import { t } from '@/services/i18n'
import { fetchIconUrl } from '@/services/chrome'
import { APP_ID, VERSION, OPTION_MSG } from '@/const'
import messages from '@/../public/_locales/en/messages.json'

import { Popup } from '@/components/Popup'
import { LoadingIcon } from '@/components/option/LoadingIcon'
import { TableOfContents } from '@/components/option/TableOfContents'
import { ImportExport } from '@/components/option/ImportExport'
import { HubBanner } from '@/components/option/HubBanner'
import { useEventProxyReceiver } from '@/hooks/option/useEventProxy'

import css from './Option.module.css'

const getTranslation = () => {
  const obj = {} as { [key: string]: string }
  for (const key in messages) {
    if (key.startsWith('Option_')) {
      obj[key] = t(key)
    }
  }
  return obj
}

export function Option() {
  const [iframeRetryCount, setIframeRetryCount] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [previewElm, setPreviewElm] = useState<Element | null>(null)
  const iframeTORef = useRef<number>(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const loadingRef = useRef<HTMLDivElement>(null)
  const [popupElm, setPopupElm] = useState<Element | null>(null)
  const [popupHeight, setPopupHeight] = useState(0)

  useEventProxyReceiver()

  const updateSettings = async (settings: SettingsType) => {
    if (isSaving) return
    try {
      setIsSaving(true)
      const current = await Settings.get(true)
      const linkCommands = current.commands.filter(isLinkCommand).map((c) => ({
        ...c,
        openMode: settings.linkCommand.openMode,
      }))
      settings.commands = [...settings.commands, ...linkCommands]
      await Settings.set(settings)
      await sleep(1000)
    } catch (e) {
      console.error('Failed to update settings!', settings)
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    const func = async (event: MessageEvent) => {
      const command = event.data.command
      const value = event.data.value
      switch (command) {
        case OPTION_MSG.START_ACK:
          // setIsIframeReady(true)
          clearInterval(iframeTORef.current)
          break
        case OPTION_MSG.CHANGED:
          updateSettings(value)
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

  const onLoadIframe = async () => {
    console.debug('onLoadIframe')
    const settings = await Settings.get(true)
    const translation = getTranslation()

    // Convert linkCommand option
    const linkCommands = settings.commands.filter(isLinkCommand)
    if (linkCommands.length > 0) {
      const linkCommand = linkCommands[0]
      settings.linkCommand = {
        ...settings.linkCommand,
        openMode: linkCommand.openMode,
      }
    }
    settings.commands = settings.commands.filter(isMenuCommand)

    // Retry until the iframe is ready
    iframeTORef.current = window.setInterval(() => {
      if (iframeRetryCount > 100) {
        console.error('Failed to initialize iframe for SettingForm')
        clearInterval(iframeTORef.current)
      }
      console.debug('send settings: ', iframeRetryCount)
      sendMessage(OPTION_MSG.START, {
        settings,
        translation,
      })
      setIframeRetryCount((c) => c + 1)
    }, 50)
  }

  const onClickMenu = (hash: string) => {
    sendMessage(OPTION_MSG.JUMP, { hash })
  }

  const sandboxUrl = () => {
    const src = chrome.runtime.getURL('src/sandbox.html')
    if (document.location.hash) {
      return `${src}${document.location.hash}`
    } else {
      return src
    }
  }

  return (
    <div className={css.option}>
      <CSSTransition
        in={isSaving}
        timeout={300}
        classNames="drop-in"
        unmountOnExit
        nodeRef={loadingRef}
      >
        <LoadingIcon ref={loadingRef}>
          <span>{t('saving')}</span>
        </LoadingIcon>
      </CSSTransition>

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

      <iframe
        title="SettingForm"
        id="sandbox"
        src={sandboxUrl()}
        ref={iframeRef}
        className={css.editorFrame}
        onLoad={onLoadIframe}
      />
    </div>
  )
}
