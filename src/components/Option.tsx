import React, { useState, useEffect, useRef } from 'react'
import { CSSTransition } from 'react-transition-group'

import { LoadingIcon } from './LoadingIcon'
import { Storage, STORAGE_KEY } from '../services/storage'
import { UserSettings, UserSettingsType } from '../services/userSettings'
import { sleep, toDataURL, toUrl } from '../services/util'
import { t } from '../services/i18n'
import { APP_ID, VERSION } from '../const'
import { Dialog } from './Dialog'
import messages from '../../dist/_locales/en/messages.json'

import './App.css'
import css from './Option.module.css'

function isBase64(str: string): boolean {
  return /base64/.test(str)
}

function getFaviconUrl(urlStr: string): string {
  const url = new URL(urlStr)
  const domain = url.hostname
  const favUrl = `https://s2.googleusercontent.com/s2/favicons?domain=${domain}&sz=128`
  return favUrl
}

const fetchIconUrl = async (url: string) => {
  const urlStr = toUrl(url, 'test')
  const res = await fetch(urlStr)
  const text = await res.text()
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'text/html')
  const icons = doc.querySelectorAll(
    'link[rel="icon"], link[rel="shortcut icon"]',
  )
  if (icons.length === 0) {
    return getFaviconUrl(url)
  }
  const iconUrl = icons[icons.length - 1].getAttribute('href')
  // console.debug('iconUrl', iconUrl)
  if (iconUrl?.startsWith('//')) {
    const protocol = new URL(urlStr).protocol
    return `${protocol}${iconUrl}`
  } else if (iconUrl?.startsWith('/')) {
    const origin = new URL(urlStr).origin
    return `${origin}${iconUrl}`
  }
  return iconUrl
}

const getTranslation = () => {
  let obj = {} as { [key: string]: string }
  Object.keys(messages).forEach((key) => {
    if (key.startsWith('Option_')) {
      obj[key] = t(key)
    }
  })
  return obj
}

function getTimestamp() {
  let date = new Date()
  let year = date.getFullYear()
  let month = (date.getMonth() + 1).toString().padStart(2, '0')
  let day = date.getDate().toString().padStart(2, '0')
  let hours = date.getHours().toString().padStart(2, '0')
  let minutes = date.getMinutes().toString().padStart(2, '0')
  return year + month + day + '_' + hours + minutes
}

export function Option() {
  const [settings, setSettings] = useState<UserSettingsType>()
  const [timeoutID, setTimeoutID] = useState<number>()
  const [iframeHeight, setIframeHeight] = useState<number>()
  const [iconVisible, setIconVisible] = useState(false)
  const [resetDialog, setResetDialog] = useState(false)
  const [importDialog, setImportDialog] = useState(false)
  const [importJson, setImportJson] = useState<UserSettingsType>()

  const iframeRef = useRef(null)
  const inputFile = useRef(null)

  const updateSettings = async () => {
    try {
      if (settings == null) return
      setIconVisible(true)

      // Convert iconUrl to DataURL
      await Promise.all(
        settings.commands.map(async (c) => {
          if (!c.iconUrl) return
          if (isBase64(c.iconUrl)) return

          let dataUrl = await toDataURL(c.iconUrl)
          console.debug('dataUrl', dataUrl)
          c.iconUrl = dataUrl
        }),
      )

      console.debug('update settings', settings)
      await Storage.set(STORAGE_KEY.USER, settings)
      await sleep(1000)
      setIconVisible(false)
    } catch {
      console.log('failed to update settings!')
    }
  }

  useEffect(() => {
    let unmounted = false
    if (timeoutID) clearTimeout(timeoutID)
    const newTimeoutId = window.setTimeout(() => {
      if (unmounted) return
      updateSettings()
      setTimeoutID(undefined)
    }, 1 * 500 /* ms */)
    setTimeoutID(newTimeoutId)

    return () => {
      unmounted = true
      clearTimeout(timeoutID)
    }
  }, [settings])

  useEffect(() => {
    const func = async (event: MessageEvent) => {
      const command = event.data.command
      const value = event.data.value
      if (command === 'changed') {
        setSettings(value)
      } else if (command === 'setHeight') {
        setIframeHeight(value)
      } else if (command === 'fetchIconUrl') {
        const { searchUrl, settings } = value
        const url = await fetchIconUrl(searchUrl)
        if (url && settings) {
          settings.commands.forEach((command) => {
            if (!command.iconUrl && command.searchUrl) {
              if (command.searchUrl === searchUrl) {
                command.iconUrl = url
              }
            }
          })
          setSettings(settings)
          sendMessage('changed', settings)
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
    const data = await Storage.get(STORAGE_KEY.USER)
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
        await Storage.set(STORAGE_KEY.USER, importJson)
        location.reload()
      })()
    }
    setImportDialog(false)
  }

  const sendMessage = (command: string, value: any) => {
    if (iframeRef.current != null) {
      let message = { command, value }
      iframeRef.current.contentWindow.postMessage(message, '*')
    } else {
      console.warn('frame null')
      console.warn(iframeRef)
    }
  }

  const onLoadIfame = async () => {
    const settings = await Storage.get(STORAGE_KEY.USER)
    const translation = getTranslation()
    sendMessage('start', {
      settings,
      translation,
    })
  }

  return (
    <div className={css.option}>
      <CSSTransition
        in={iconVisible}
        timeout={300}
        classNames="drop-in"
        unmountOnExit
      >
        <LoadingIcon>
          <span>{t('saving')}</span>
        </LoadingIcon>
      </CSSTransition>
      <header className={css.titleHeader}>
        <h1 className={css.title}>{APP_ID?.replace('-', ' ')}</h1>
        <span className={css.version}>Version: {VERSION}</span>
      </header>
      <div className={css.menu}>
        <button onClick={handleReset} className={css.button}>
          {t('Option_Reset')}
        </button>
        <button onClick={handleExport} className={css.button}>
          {t('Option_Export')}
        </button>
        <button onClick={() => setImportDialog(true)} className={css.button}>
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
          className={css.button + ' ' + css.buttonImport}
        ></input>
      </Dialog>
      <iframe
        id="sandbox"
        src="sandbox.html"
        ref={iframeRef}
        className={css.editorFrame}
        onLoad={onLoadIfame}
        height={iframeHeight}
      ></iframe>
    </div>
  )
}
