import React, { useState, useEffect } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import Ajv from 'ajv'

const ajv = new Ajv({ allErrors: true, verbose: true })

import { Storage, STORAGE_KEY } from '../services/storage'
import { UseSettings } from '../services/userSettings'
import { LoadingIcon } from './LoadingIcon'
import { sleep } from '../services/util'
import * as i18n from '../services/i18n'

import { option, textarea, menu, button } from './Option.module.css'

async function getSettings(): Promise<string> {
  let obj = await Storage.get(STORAGE_KEY.USER)
  return JSON.stringify(obj, null, '  ')
}

export function Option() {
  const [settings, setSettings] = useState<string>('')
  const [defaultVal, setDefaultVal] = useState<string>('')
  const [timeoutID, setTimeoutID] = useState<number>()
  const [iconVisible, setIconVisible] = useState(false)

  const updateSettings = async () => {
    try {
      const settingObj = JSON.parse(settings)
      setIconVisible(true)
      await Storage.set(STORAGE_KEY.USER, settingObj)
      await sleep(1000)
      setIconVisible(false)
    } catch {
      if (defaultVal != null && defaultVal.length > 0) {
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

  const onChange = ({ target: { value } }) => {
    setSettings(value)
  }

  const onClickReset = () => {
    UseSettings.reset().then(() => location.reload())
  }

  return (
    <div className={option}>
      {iconVisible && (
        <LoadingIcon>
          <span>{i18n.t('saving')}</span>
        </LoadingIcon>
      )}
      <TextareaAutosize
        className={textarea}
        defaultValue={defaultVal}
        onChange={onChange}
      />
      <div className={menu}>
        <button onClick={onClickReset} className={button}>
          Reset
        </button>
      </div>
    </div>
  )
}
