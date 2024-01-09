import React, { useState, useEffect } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { Storage, STORAGE_KEY } from './services/storage'
import { UseSettings } from './services/userSettings'

import { option, textarea, menu, button } from './Option.module.css'

async function getSettings(): Promise<string> {
  let obj = await Storage.get(STORAGE_KEY.USER)
  return JSON.stringify(obj, null, '  ')
}

export function Option() {
  const [defaultVal, setDefaultVal] = useState<string>('')
  const [timeoutID, setTimeoutID] = useState<number>()
  const [settings, setSettings] = useState<string>('')

  useEffect(() => {
    ;(async () => {
      setDefaultVal(await getSettings())
    })()
  }, [])

  useEffect(() => {
    let unmounted = false
    if (timeoutID) clearTimeout(timeoutID)
    const newTimeoutId = window.setTimeout(() => {
      if (unmounted) return
      try {
        const settingObj = JSON.parse(settings)
        Storage.set(STORAGE_KEY.USER, settingObj).then(() => {
          console.log('option saved!')
        })
      } catch {
        // do nothing
      }
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
    UseSettings.reset()
  }

  return (
    <div className={option}>
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
