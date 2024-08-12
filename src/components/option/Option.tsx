import React, { useState, useEffect, useRef } from 'react'
import { CSSTransition } from 'react-transition-group'

import { UserSettings } from '@/services/userSettings'
import type { UserSettingsType } from '@/services/userSettings'
import {
  sleep,
  toUrl,
  hasSubdomain,
  getLowerDomainUrl,
  capitalize,
} from '@/services/util'
import { t } from '@/services/i18n'
import { APP_ID, VERSION, OPTION_MSG } from '@/const'
import messages from '@/../dist/_locales/en/messages.json'

import { Popup } from '@/components/Popup'
import { LoadingIcon } from '@/components/option/LoadingIcon'
import { ImportExport } from '@/components/option/ImportExport'
import '@/components/App.css'
import css from './Option.module.css'

const getFaviconFromGoogle = (urlStr: string): string => {
  const url = new URL(urlStr)
  const domain = url.hostname
  const favUrl = `https://s2.googleusercontent.com/s2/favicons?domain=${domain}&sz=128`
  return favUrl
}

const getFaviconFromDom = async (
  urlStr: string,
): Promise<string | undefined> => {
  try {
    const res = await fetch(urlStr)
    const text = await res.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(text, 'text/html')
    const icons = doc.querySelectorAll(
      'link[rel="icon"], link[rel="shortcut icon"]',
    )
    console.debug('icons', icons)
    if (icons.length > 0) {
      const iconUrl = icons[icons.length - 1].getAttribute('href')
      // console.debug('iconUrl', iconUrl)
      if (iconUrl?.startsWith('http')) {
        return iconUrl
      }
      if (iconUrl?.startsWith('//')) {
        const protocol = new URL(urlStr).protocol
        return `${protocol}${iconUrl}`
      }
      if (iconUrl?.startsWith('/')) {
        const origin = new URL(urlStr).origin
        return `${origin}${iconUrl}`
      }
    }
  } catch (e) {
    console.warn('Failed to fetch icon', urlStr)
  }
  return
}

/**
 * Get favicon url from url.
 *
 * @param {string} url
 * @returns {Promise<string>} favicon url
 */
const fetchIconUrl = async (url: string): Promise<string> => {
  const urlStr = toUrl(url, 'test')
  const faviconUrl = await getFaviconFromDom(urlStr)
  if (faviconUrl) {
    return faviconUrl
  }
  // Try to get favicon from root domain.
  if (hasSubdomain(urlStr)) {
    const rootDomainUrl = getLowerDomainUrl(urlStr)
    const faviconUrl = await getFaviconFromDom(rootDomainUrl)
    if (faviconUrl) {
      return faviconUrl
    }
  }
  // Try to get favicon from googleusercontent.com
  return getFaviconFromGoogle(url)
}

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
  const [isSaving, setIsSaving] = useState(false)

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef<HTMLDivElement>(null)

  const updateSettings = async (settings: UserSettingsType) => {
    if (isSaving) return
    try {
      setIsSaving(true)
      await UserSettings.set(settings)
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
      if (command === OPTION_MSG.CHANGED) {
        updateSettings(value)
      } else if (command === OPTION_MSG.FETCH_ICON_URL) {
        const { searchUrl } = value
        console.log('fetchIconUrl', searchUrl)
        const iconUrl = await fetchIconUrl(searchUrl)
        if (iconUrl) {
          sendMessage(OPTION_MSG.RES_FETCH_ICON_URL, { searchUrl, iconUrl })
        }
      }
    }
    window.addEventListener('message', func)
    return () => {
      window.removeEventListener('message', func)
    }
  }, [])

  const sendMessage = (command: OPTION_MSG, value: unknown) => {
    if (iframeRef.current != null && iframeRef.current.contentWindow != null) {
      const message = { command, value }
      iframeRef.current.contentWindow.postMessage(message, '*')
    } else {
      console.warn('frame null')
      console.warn(iframeRef)
    }
  }

  const onLoadIfame = async () => {
    const settings = await UserSettings.get(true)
    const translation = getTranslation()
    sendMessage(OPTION_MSG.START, {
      settings,
      translation,
    })
  }

  const sandboxUrl = () => {
    if (document.location.hash) {
      return `sandbox.html${document.location.hash}`
    } else {
      return `sandbox.html`
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

      <ImportExport />

      <div className={css.preview} ref={previewRef}>
        <Popup
          positionElm={previewRef.current}
          selectionText=""
          isPreview={true}
        />
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
        onLoad={onLoadIfame}
      />
    </div>
  )
}
