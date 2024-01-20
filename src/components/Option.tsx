import React, { useState, useEffect, useRef } from 'react'
import { CSSTransition } from 'react-transition-group'

import { LoadingIcon } from './LoadingIcon'
import { Storage, STORAGE_KEY } from '../services/storage'
import { UseSettings, UseSettingsType } from '../services/userSettings'
import { sleep, toDataURL } from '../services/util'
import * as i18n from '../services/i18n'
import { APP_ID } from '../const'

import css from './Option.module.css'

async function getSettings(): Promise<UseSettingsType> {
  return (await Storage.get(STORAGE_KEY.USER)) as UseSettingsType
}

function isBase64(str: string): boolean {
  return /base64/.test(str)
}

export function Option() {
  const [settings, setSettings] = useState<UseSettingsType>()
  const [defaultVal, setDefaultVal] = useState<UseSettingsType>()
  const [timeoutID, setTimeoutID] = useState<number>()
  const [iframeHeight, setIframeHeight] = useState<number>()
  const [iconVisible, setIconVisible] = useState(false)
  const iframeRef = useRef(null)

  const updateSettings = async () => {
    try {
      if (settings == null) return
      setIconVisible(true)

      // Convert iconUrl to DataURL
      await Promise.all(
        settings.commands.map(async (c) => {
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
      if (defaultVal != null) {
        console.log('failed to update settings!')
      }
    }
  }

  useEffect(() => {
    ;(async () => setDefaultVal(await getSettings()))()
  }, [])

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
    const func = (event) => {
      const command = event.data.command
      const value = event.data.value
      console.log(command, value)

      if (command === 'changed') {
        setSettings(value)
      } else if (command === 'setHeight') {
        setIframeHeight(value)
      }
    }
    window.addEventListener('message', func)
    return () => {
      window.removeEventListener('message', func)
    }
  }, [])

  const onClickReset = () => {
    UseSettings.reset().then(() => location.reload())
  }

  const onLoadIfame = () => {
    if (iframeRef.current != null) {
      let message = {
        command: 'start',
        value: defaultVal,
      }
      console.log('send message', message)
      iframeRef.current.contentWindow.postMessage(message, '*')
    } else {
      console.warn('frame null')
      console.warn(iframeRef)
    }
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
          <span>{i18n.t('saving')}</span>
        </LoadingIcon>
      </CSSTransition>
      <h1 className={css.title}>{APP_ID?.replace('-', ' ')}</h1>
      <div className={css.menu}>
        <button onClick={onClickReset} className={css.button}>
          Reset
        </button>
      </div>
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
