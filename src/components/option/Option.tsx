import React, { useState, useEffect, useRef } from 'react'
import { CSSTransition } from 'react-transition-group'

import { UserSettings } from '@/services/userSettings'
import type { UserSettingsType } from '@/services/userSettings'
import { sleep, toUrl, capitalize } from '@/services/util'
import { t } from '@/services/i18n'
import { APP_ID, VERSION, OPTION_MSG } from '@/const'
import messages from '@/../dist/_locales/en/messages.json'

import { Popup } from '@/components/Popup'
import { LoadingIcon } from '@/components/option/LoadingIcon'
import { ImportExport } from '@/components/option/ImportExport'
import '@/components/App.css'
import css from './Option.module.css'

/**
 * Get favicon url from url.
 *
 * @param {string} url
 * @returns {Promise<string>} favicon url
 */
const fetchIconUrl = async (url: string): Promise<string> => {
  const p = new Promise<string>(async (resolve, reject) => {
    let w: chrome.windows.Window
    const timeoutId = setTimeout(() => {
      chrome.windows.remove(w.id as number)
      console.warn('timeout', url)
      reject()
    }, 5000)
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (tabId === w.tabs?.[0].id && changeInfo.status === 'complete') {
        clearTimeout(timeoutId)
        chrome.windows.remove(w.id as number)
        if (tab.favIconUrl) {
          resolve(tab.favIconUrl)
        } else {
          // retry
          await sleep(100)
          const t = await chrome.tabs.get(tabId)
          if (tab.favIconUrl) {
            resolve(t.favIconUrl as string)
          } else {
            // failed...
            console.warn(tab)
            reject()
          }
        }
      }
    })
    w = await chrome.windows.create({
      url: toUrl(url, 'test'),
      state: 'minimized',
    })
  })
  return p
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
