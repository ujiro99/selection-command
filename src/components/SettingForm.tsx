import React, { useState, useEffect } from 'react'
import { IconButtonProps, FieldProps, RegistryFieldsType } from '@rjsf/utils'
import validator from '@rjsf/validator-ajv8'
import Form, { IChangeEvent } from '@rjsf/core'
import classnames from 'classnames'
import platform from 'platform'

import userSettingSchema from '../services/userSettingSchema.json'
import { UserSettingsType, FolderOption } from '../services/userSettings'

import { Icon } from '../components/Icon'
import { OPEN_MODE } from '../const'

import * as css from './SettingForm.module.css'

type folderOptionsType = {
  enumNames: string[]
  enum: FolderOption[]
}

type Translation = {
  [key: string]: string
}

export function SettingFrom() {
  const [parent, setParent] = useState<MessageEventSource>()
  const [origin, setOrigin] = useState('')
  const [trans, setTrans] = useState<Translation>({})
  const [settingData, setSettingData] = useState<UserSettingsType>()

  const t = (key: string) => {
    return trans[`Option_${key}`]
  }

  useEffect(() => {
    const func = (event: MessageEvent) => {
      const command = event.data.command
      const value = event.data.value
      console.debug('recv message', command, value)
      if (command === 'start') {
        const { settings, translation } = value
        if (event.source != null) {
          setParent(event.source)
          setOrigin(event.origin)
          setSettingData(settings)
          setTrans(translation)
        }
      } else if (command === 'changed') {
        setSettingData(value)
      }
    }
    window.addEventListener('message', func)
    return () => {
      window.removeEventListener('message', func)
    }
  }, [])

  const sendMessage = (command: string, value: any) => {
    if (parent != null) {
      console.debug('send message', command, value)
      parent.postMessage({ command, value }, origin)
    }
  }

  const updateSettings = (data: UserSettingsType) => {
    sendMessage('changed', data)
    setSettingData(data)
  }

  const onChange = (arg: IChangeEvent, id?: string) => {
    // update iconURL when searchUrl setted
    if (id && id.endsWith('searchUrl')) {
      const data = arg.formData as UserSettingsType
      data.commands.forEach((command) => {
        if (!command.iconUrl && command.searchUrl) {
          sendMessage('fetchIconUrl', {
            searchUrl: command.searchUrl,
            settings: data,
          })
          return
        }
      })
    }
    updateSettings(arg.formData)
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
          iconUrl: cur.iconUrl,
        })
        return acc
      },
      { enumNames: [], enum: [] } as folderOptionsType,
    )
    userSettingSchema.definitions.folderOptions = folderOptions
    console.debug('settingData', settingData)
  }

  // SidePanel is not supported in browsers other than Chrome
  if (platform.name !== 'Chrome') {
    const modes = userSettingSchema.definitions.command.properties.openMode.enum
    userSettingSchema.definitions.command.properties.openMode.enum =
      modes.filter((e) => e != OPEN_MODE.SIDE_PANEL)
  }

  const fields: RegistryFieldsType = {
    '#/popupPlacement': SelectField,
    '#/style': SelectField,
    '#/commands/iconUrl': IconUrlField,
    '#/commands/fetchOptions': FetchOptionField,
    '#/commands/openMode': SelectField,
    '#/commands/parentFolder': FolderField,
    '#/commandFolder/iconUrl': IconUrlField,
    '#/commandFolder/onlyIcon': OnlyIconField,
    ArraySchemaField: CustomArraySchemaField,
  }

  const uiSchema = {
    popupPlacement: {
      'ui:classNames': 'popupPlacement',
      'ui:title': t('popupPlacement'),
    },
    style: {
      'ui:classNames': 'style',
      'ui:title': t('style'),
      enum: {
        vertical: { 'ui:title': t('style_vertical') },
        horizontal: { 'ui:title': t('style_horizontal') },
      },
    },
    commands: {
      'ui:title': t('commands'),
      'ui:description': t('searchUrl') + ': ' + t('commands_desc'),
      items: {
        'ui:classNames': 'commandItem',
        popupOption: { 'ui:widget': 'hidden' },
        title: { 'ui:title': t('title') },
        searchUrl: {
          'ui:title': t('searchUrl'),
        },
        iconUrl: { 'ui:title': t('iconUrl') },
        openMode: {
          'ui:title': t('openMode'),
          enum: {
            popup: { 'ui:title': t('openMode_popup') },
            tab: { 'ui:title': t('openMode_tab') },
            api: { 'ui:title': t('openMode_api') },
            sidePanel: { 'ui:title': t('openMode_sidePanel') },
          },
        },
        parentFolder: { 'ui:title': t('parentFolder') },
        fetchOptions: { 'ui:title': t('fetchOptions') },
        variables: {
          'ui:classNames': 'variables',
          'ui:title': t('variables'),
          items: {
            'ui:classNames': 'variableItem',
          },
        },
      },
    },
    folders: {
      'ui:title': t('folders'),
      'ui:description': t('folders_desc'),
      items: {
        id: { 'ui:widget': 'hidden' },
        'ui:classNames': 'folderItem',
        title: { 'ui:title': t('title') },
        iconUrl: { 'ui:title': t('iconUrl') },
        onlyIcon: {
          'ui:title': t('onlyIcon'),
          'ui:description': t('onlyIcon_desc'),
        },
      },
    },
    pageRules: {
      'ui:title': t('pageRules'),
      'ui:description': t('pageRules_desc'),
      items: {
        'ui:classNames': 'pageRuleItem',
        urlPattern: { 'ui:title': t('urlPattern') },
        popupEnabled: { 'ui:title': t('popupEnabled') },
        popupPlacement: { 'ui:title': t('popupPlacement') },
      },
    },
    AddButton: {
      'ui:title': t('Add'),
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
      className={classnames(css.buttonItems, css.buttonItemsDanger)}
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

const SelectField = (props: FieldProps) => {
  const { formData, schema, uiSchema } = props
  const options = schema.enum.map((e: string) => {
    let name =
      uiSchema && uiSchema.enum && uiSchema.enum[e]
        ? uiSchema.enum[e]['ui:title']
        : e
    return { name, value: e }
  })
  const onChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    props.onChange(event.target.value)
  }
  return (
    <label className={classnames(css.selectContainer, 'form-control')}>
      <select
        id={props.idSchema.$id}
        className={css.select}
        value={formData}
        required={props.required}
        onChange={onChange}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  )
}

const FolderField = (props: FieldProps) => {
  const { formData, schema, registry } = props
  const folderOptions = schema.enum as FolderOption[]

  const onChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const id = event.target.value
    const folder = folderOptions.find((folder) => folder.id === id)
    props.onChange(folder)
  }

  const folder = registry.rootSchema.definitions.folderOptions.enum.find(
    (e) => e.id === formData?.id,
  )

  return (
    <label className={classnames(css.selectContainer, 'form-control')}>
      {folder && <img className={css.iconUrlPreview} src={folder.iconUrl} />}
      <select
        id={props.idSchema.$id}
        className={css.select}
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
  console.log('OnlyIconField', props)
  let title = 'Only Icon'
  let desc = ''
  if (props.uiSchema) {
    title = props.uiSchema['ui:title'] ?? title
    desc = props.uiSchema['ui:description'] ?? desc
  }
  return (
    <>
      <label className="control-label has-description">
        <p className="title">{title}</p>
        <p className="desc">{desc}</p>
      </label>
      <label className="form-control checkbox">
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
