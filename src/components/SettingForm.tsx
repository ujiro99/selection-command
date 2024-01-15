import React, { useState, useEffect } from 'react'
import { IconButtonProps } from '@rjsf/utils'
import validator from '@rjsf/validator-ajv8'
import Form from '@rjsf/core'
import classNames from 'classnames'

import userSettingSchema from '../services/userSettingSchema.json'
import { Icon } from '../components/Icon'

import * as css from './SettingForm.module.css'

export function SettingFrom() {
  const [parent, setParent] = useState()
  const [origin, setOrigin] = useState()
  const [defaultData, setDefaultData] = useState()

  useEffect(() => {
    const func = (event) => {
      const command = event.data.command
      const value = event.data.value
      console.log(event.data)

      if (command === 'start') {
        setParent(event.source)
        setOrigin(event.origin)
        setDefaultData(value)
      }
    }
    window.addEventListener('message', func)
    return () => {
      window.removeEventListener('message', func)
    }
  }, [])

  const onChange = (arg) => {
    if (parent) {
      parent.postMessage({ command: 'changed', value: arg.formData }, origin)
    }
  }

  const log = (type: any) => console.log.bind(console, type)
  return (
    <>
      <Form
        schema={userSettingSchema}
        validator={validator}
        formData={defaultData}
        onChange={onChange}
        onError={log('errors')}
        templates={{
          ButtonTemplates: {
            AddButton,
            MoveDownButton,
            MoveUpButton,
            RemoveButton,
          },
        }}
      />
    </>
  )
}

function AddButton(props: IconButtonProps) {
  const { icon, uiSchema, ...btnProps } = props
  return (
    <button {...btnProps} className={css.button}>
      <Icon name="plus" sandbox />
      <span>Add</span>
    </button>
  )
}

function MoveUpButton(props: IconButtonProps) {
  const { icon, uiSchema, ...btnProps } = props
  return (
    <button {...btnProps} className={css.buttonItems}>
      <Icon name="arrow-up" sandbox />
    </button>
  )
}

function MoveDownButton(props: IconButtonProps) {
  const { icon, uiSchema, ...btnProps } = props
  return (
    <button {...btnProps} className={css.buttonItems}>
      <Icon name="arrow-down" sandbox />
    </button>
  )
}

function RemoveButton(props: IconButtonProps) {
  const { icon, uiSchema, ...btnProps } = props
  return (
    <button
      {...btnProps}
      className={classNames(css.buttonItems, css.buttonItemsDanger)}
    >
      <Icon name="delete" sandbox />
    </button>
  )
}
