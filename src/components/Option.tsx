import React, { useState, useEffect, useRef } from 'react'
import { CSSTransition } from 'react-transition-group'

import { LoadingIcon } from './LoadingIcon'
import { Storage, STORAGE_KEY } from '../services/storage'
import { UserSettings, UserSettingsType } from '../services/userSettings'
import { sleep, toDataURL } from '../services/util'
import * as i18n from '../services/i18n'
import { APP_ID } from '../const'
import { Dialog } from './Dialog'

import './App.css'
import css from './Option.module.css'

function isBase64(str: string): boolean {
  return /base64/.test(str)
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
  const [defaultVal, setDefaultVal] = useState<UserSettingsType>()
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
      if (defaultVal != null) {
        console.log('failed to update settings!')
      }
    }
  }

  useEffect(() => {
    ;(async () => {
      const data = await Storage.get(STORAGE_KEY.USER)
      setDefaultVal(data as UserSettingsType)
    })()
    Storage.addListener(STORAGE_KEY.USER, (value) => {
      setDefaultVal(value)
    })
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
      // console.log(command, value)

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

  const handleReset = () => {
    setResetDialog(true)
  }

  const handleResetClose = (ret: boolean) => {
    if (ret) {
      UserSettings.reset().then(() => location.reload())
    }
    setResetDialog(false)
  }

  const handleExport = () => {
    const text = JSON.stringify(defaultVal, null, 2)
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

  const onLoadIfame = () => {
    if (iframeRef.current != null) {
      let message = {
        command: 'start',
        value: defaultVal,
      }
      console.debug('send message', message)
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
        <button onClick={handleReset} className={css.button}>
          Reset
        </button>
        <button onClick={handleExport} className={css.button}>
          Export
        </button>
        <button onClick={() => setImportDialog(true)} className={css.button}>
          Import
        </button>
      </div>
      <Dialog
        open={resetDialog}
        onClose={handleResetClose}
        title={'Reset settings?'}
        description={() => (
          <span>
            Is it okay to reset all settings to default?
            <br />
            This operation cannot be undone. <br />※ We recommend{' '}
            <b>"Export"</b> beforehand.
          </span>
        )}
        okText={'Reset'}
      />
      <Dialog
        open={importDialog}
        onClose={handleImportClose}
        title={'Import settings'}
        description={() => (
          <span>Please select the settings file(*.json) to import.</span>
        )}
        okText={'Import'}
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
