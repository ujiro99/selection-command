import React, { useState, useEffect } from 'react'
import { IconButtonProps, FieldProps, RegistryFieldsType } from '@rjsf/utils'
import validator from '@rjsf/validator-ajv8'
import Form, { IChangeEvent } from '@rjsf/core'
import classNames from 'classnames'

import userSettingSchema from '../services/userSettingSchema.json'
import { UserSettingsType, FolderOption } from '../services/userSettings'

import { Icon } from '../components/Icon'

import * as css from './SettingForm.module.css'

function getFaviconUrl(urlStr: string): string {
  const url = new URL(urlStr)
  const domain = url.hostname
  const favUrl = `https://s2.googleusercontent.com/s2/favicons?domain=${domain}&sz=128`
  return favUrl
}

type folderOptionsType = {
  enumNames: string[]
  enum: FolderOption[]
}

export function SettingFrom() {
  const [parent, setParent] = useState<MessageEventSource>()
  const [origin, setOrigin] = useState('')
  const [settingData, setSettingData] = useState<UserSettingsType>()

  useEffect(() => {
    const func = (event: MessageEvent) => {
      const command = event.data.command
      const value = event.data.value
      console.debug(event.data)

      if (command === 'start') {
        if (event.source != null) {
          setParent(event.source)
          setOrigin(event.origin)
          setSettingData(value)
        }
      }
    }
    window.addEventListener('message', func)
    return () => {
      window.removeEventListener('message', func)
    }
  }, [])

  const onChange = (arg: IChangeEvent, id?: string) => {
    const data = arg.formData as UserSettingsType

    // update iconURL when searchUrl setted
    if (id && id.endsWith('searchUrl')) {
      data.commands.forEach((command) => {
        if (!command.iconUrl && command.searchUrl) {
          command.iconUrl = getFaviconUrl(command.searchUrl)
        }
      })
    }

    if (parent != null) {
      parent.postMessage({ command: 'changed', value: data }, origin)
    }
    setSettingData(data)
  }

  // Create folder options
  if (settingData) {
    const folders = settingData.folders
    const folderOptions: folderOptionsType = folders.reduce(
      (acc, cur) => {
        acc.enumNames.push(cur.title)
        acc.enum.push({
          id: cur.id,
          name: cur.title,
        })
        return acc
      },
      { enumNames: [], enum: [] } as folderOptionsType,
    )
    userSettingSchema.definitions.folderOptions = folderOptions
  }

  const fields: RegistryFieldsType = {
    '#/commands/iconUrl': IconUrlField,
    '#/commands/fetchOptions': FetchOptionField,
    '#/commands/parentFolder': FolderField,
    '#/commandFolder/iconUrl': IconUrlField,
    '#/commandFolder/onlyIcon': OnlyIconField,
    ArraySchemaField: CustomArraySchemaField,
  }

  const uiSchema = {
    commands: {
      items: {
        'ui:classNames': 'commandItem',
        variables: {
          'ui:classNames': 'variables',
          items: {
            'ui:classNames': 'variableItem',
          },
        },
      },
    },
    folders: {
      items: {
        id: { 'ui:widget': 'hidden' },
        'ui:classNames': 'folderItem',
      },
    },
    pageRules: {
      items: {
        'ui:classNames': 'pageRuleItem',
      },
    },
  }

  const log = (type: any) => console.log.bind(console, type)
  return (
    <Form
      schema={userSettingSchema}
      validator={validator}
      formData={settingData}
      onChange={onChange}
      onError={log('errors')}
      uiSchema={uiSchema}
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
      <Icon name="plus" />
      <span>Add</span>
    </button>
  )
}

function MoveUpButton(props: IconButtonProps) {
  const { icon, uiSchema, ...btnProps } = props
  return (
    <button {...btnProps} className={css.buttonItems}>
      <Icon name="arrow-up" />
    </button>
  )
}

function MoveDownButton(props: IconButtonProps) {
  const { icon, uiSchema, ...btnProps } = props
  return (
    <button {...btnProps} className={css.buttonItems}>
      <Icon name="arrow-down" />
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
      <Icon name="delete" />
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
        value={props.formData}
        required={props.required}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </label>
  )
}

const FolderField = (props: FieldProps) => {
  const { formData, schema } = props
  const folderOptions = schema.enum as FolderOption[]

  const onChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const id = event.target.value
    const folder = folderOptions.find((folder) => folder.id === id)
    props.onChange(folder)
  }

  return (
    <label className={css.folder + ' form-control'}>
      <select
        id={props.idSchema.$id}
        className={css.folderInput}
        value={formData?.id}
        required={props.required}
        onChange={onChange}
      >
        <option key="" value="">
          -- none --
        </option>
        {folderOptions.map((folder) => (
          <option key={folder.id} value={folder.id}>
            {folder.name}
          </option>
        ))}
      </select>
    </label>
  )
}

const FetchOptionField = (props: FieldProps) => {
  return (
    <label className={css.fetchOption + ' form-control'}>
      <textarea
        id={props.idSchema.$id}
        className={css.fetchOptionInput}
        value={props.formData}
        required={props.required}
        onChange={(event) => props.onChange(event.target.value)}
      ></textarea>
    </label>
  )
}

const OnlyIconField = function (props: FieldProps) {
  return (
    <>
      <label className="control-label">{props.schema.name}</label>
      <label className={'form-control'}>
        <input
          id={props.idSchema.$id}
          type="checkbox"
          checked={props.formData}
          required={props.required}
          onChange={(event) => props.onChange(event.target.checked)}
        />
      </label>
    </>
  )
}

const CustomArraySchemaField = function (props: FieldProps) {
  const { index, registry, schema } = props
  const { SchemaField } = registry.fields
  const name = schema.name ?? index

  if (name === 'Folder') {
    if (props.formData.id == null) {
      props.formData.id = crypto.randomUUID()
    }
  }

  return <SchemaField {...props} name={name} />
}
