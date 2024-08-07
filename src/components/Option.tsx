import React, { useState, useEffect, useRef } from 'react'
import { CSSTransition } from 'react-transition-group'

import { LoadingIcon } from './LoadingIcon'
import { Storage, STORAGE_KEY } from '../services/storage'
import { UserSettings } from '../services/userSettings'
import type { UserSettingsType, ImageCache } from '../services/userSettings'
import {
  sleep,
  toDataURL,
  toUrl,
  isBase64,
  isUrl,
  isEmpty,
  hasSubdomain,
  getLowerDomainUrl,
} from '@/services/util'
import { t } from '../services/i18n'
import { APP_ID, VERSION, OPTION_MSG } from '../const'
import { Dialog } from './Dialog'
import messages from '../../dist/_locales/en/messages.json'
import { Popup } from '@/components/Popup'

import './App.css'
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

function getTimestamp() {
  const date = new Date()
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${year}${month}${day}_${hours}${minutes}`
}

export function Option() {
  const [iframeHeight, setIframeHeight] = useState<number>()
  const [isSaving, setIsSaving] = useState(false)
  const [resetDialog, setResetDialog] = useState(false)
  const [importDialog, setImportDialog] = useState(false)
  const [importJson, setImportJson] = useState<UserSettingsType>()

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const inputFile = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef<HTMLDivElement>(null)

  const updateSettings = async (settings: UserSettingsType) => {
    if (isSaving) return
    try {
      setIsSaving(true)

      // Convert iconUrl to DataURL for cache.
      const urls = UserSettings.getUrls(settings)
      const caches = await UserSettings.getCaches()
      const noCacheUrls = urls
        .filter((url) => !isEmpty(url))
        .filter((url) => !isBase64(url) && caches.images[url] == null)
      const newCaches = await Promise.all(
        noCacheUrls.map(async (url) => {
          let dataUrl = ''
          try {
            dataUrl = await toDataURL(url)
          } catch (e) {
            console.warn('Failed to convert to data url', url)
            console.warn(e)
          }
          return [url, dataUrl]
        }),
      )
      for (const [iconUrl, dataUrl] of newCaches) {
        caches.images[iconUrl] = dataUrl
      }

      await UserSettings.set(settings, caches)
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
      } else if (command === OPTION_MSG.SET_HEIGHT) {
        setIframeHeight(value)
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

  const handleReset = () => {
    setResetDialog(true)
  }

  const handleResetClose = (ret: boolean) => {
    if (ret) {
      UserSettings.reset().then(() => location.reload())
    }
    setResetDialog(false)
  }

  const handleExport = async () => {
    const data = await Storage.get<UserSettingsType>(STORAGE_KEY.USER)

    // for back compatibility
    // cache key to image data url
    const caches = await UserSettings.getCaches()
    for (const c of data.commands) {
      if (!c.iconUrl) continue
      if (isBase64(c.iconUrl) || isUrl(c.iconUrl)) continue
      c.iconUrl = caches.images[c.iconUrl]
    }

    const text = JSON.stringify(data, null, 2)
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    document.body.appendChild(a)
    a.download = `${APP_ID}_${getTimestamp()}.json`
    a.href = url
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    if (inputFile == null || inputFile.current == null) return
    const files = inputFile.current.files
    if (files == null) return
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target != null) {
          const text = e.target.result as string
          const json = JSON.parse(text)
          setImportJson(json)
        }
      }
      reader.readAsText(file)
    }
  }

  const handleImportClose = (ret: boolean) => {
    if (ret && importJson != null) {
      ;(async () => {
        // for back compatibility
        //cache image data url to local storage
        const caches = {} as ImageCache
        for (const c of importJson.commands) {
          if (!c.iconUrl) continue
          if (isBase64(c.iconUrl)) {
            const id = crypto.randomUUID()
            const data = c.iconUrl
            caches[id] = data
            c.iconUrl = id
          }
        }
        await UserSettings.set(importJson, { images: caches })
        location.reload()
      })()
    }
    setImportDialog(false)
  }

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
    const settings = await UserSettings.get()
    const translation = getTranslation()
    sendMessage(OPTION_MSG.START, {
      settings,
      translation,
    })
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
      <div className={css.preview} ref={previewRef}>
        <Popup
          positionElm={previewRef.current}
          selectionText=""
          isPreview={true}
        />
      </div>
      <header className={css.titleHeader}>
        <h1 className={css.title}>{APP_ID?.replace('-', ' ')}</h1>
        <span className={css.version}>Version: {VERSION}</span>
      </header>
      <div className={css.menu}>
        <button onClick={handleReset} className={css.button} type="button">
          {t('Option_Reset')}
        </button>
        <button onClick={handleExport} className={css.button} type="button">
          {t('Option_Export')}
        </button>
        <button
          onClick={() => setImportDialog(true)}
          className={css.button}
          type="button"
        >
          {t('Option_Import')}
        </button>
      </div>
      <Dialog
        open={resetDialog}
        onClose={handleResetClose}
        title={'Reset settings?'}
        description={() => (
          <span
            dangerouslySetInnerHTML={{ __html: t('Option_Reset_Description') }}
          />
        )}
        okText={t('Option_Reset')}
      />
      <Dialog
        open={importDialog}
        onClose={handleImportClose}
        title={'Import settings'}
        description={() => (
          <span
            dangerouslySetInnerHTML={{ __html: t('Option_Import_Description') }}
          />
        )}
        okText={t('Option_Import')}
      >
        <input
          type="file"
          name="settings"
          accept=".json"
          onChange={handleImport}
          ref={inputFile}
          className={`${css.button} ${css.buttonImport}`}
        />
      </Dialog>

      <iframe
        title="SettingForm"
        id="sandbox"
        src="sandbox.html"
        ref={iframeRef}
        className={css.editorFrame}
        onLoad={onLoadIfame}
        height={iframeHeight}
      />
    </div>
  )
}
