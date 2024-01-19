import React, { useState, useEffect } from 'react'
import { IconButtonProps, FieldProps, RegistryFieldsType } from '@rjsf/utils'
import validator from '@rjsf/validator-ajv8'
import Form from '@rjsf/core'
import classNames from 'classnames'

import userSettingSchema from '../services/userSettingSchema.json'
import { Icon } from '../components/Icon'

import * as css from './SettingForm.module.css'

export function SettingFrom() {
  const [parent, setParent] = useState<MessageEventSource>()
  const [origin, setOrigin] = useState('')
  const [defaultData, setDefaultData] = useState()

  useEffect(() => {
    const func = (event: MessageEvent) => {
      const command = event.data.command
      const value = event.data.value
      console.debug(event.data)

      if (command === 'start') {
        if (event.source != null) {
          setParent(event.source)
          setOrigin(event.origin)
          setDefaultData(value)
        }
      }
    }
    window.addEventListener('message', func)
    return () => {
      window.removeEventListener('message', func)
    }
  }, [])

  const onChange = (arg) => {
    if (parent != null) {
      parent.postMessage({ command: 'changed', value: arg.formData }, origin)
    }
  }

  const log = (type: any) => console.log.bind(console, type)
  return (
    <Form
      schema={userSettingSchema}
      validator={validator}
      formData={defaultData}
      onChange={onChange}
      onError={log('errors')}
      fields={fields}
      templates={{
        ButtonTemplates: {
          AddButton,
          MoveDownButton,
          MoveUpButton,
          RemoveButton,
        },
      }}
    />
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

const IconUrlField = function (props: FieldProps) {
  return (
    <label className={css.iconUrl + ' form-control'}>
      <img className={css.iconUrlPreview} src={props.formData} />
      <input
        id={props.idSchema.$id}
        type="text"
        className={css.iconUrlInput}
        defaultValue={props.formData}
        required={props.required}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </label>
  )
}

const fields: RegistryFieldsType = {
  '#/commands/iconUrl': IconUrlField,
}
