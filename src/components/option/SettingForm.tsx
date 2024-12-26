import React, { useRef, useCallback } from 'react'
import { useState, useEffect } from 'react'
import type {
  IconButtonProps,
  FieldProps,
  RegistryFieldsType,
} from '@rjsf/utils'
import validator from '@rjsf/validator-ajv8'
import Form from '@rjsf/core'
import type { IChangeEvent } from '@rjsf/core'
import clsx from 'clsx'

import settingSchema from '@/services/settingSchema'
import {
  UserStyleField,
  UserStyleMap,
} from '@/components/option/UserStyleField'
import {
  OPEN_MODE,
  DRAG_OPEN_MODE,
  OPTION_MSG,
  STARTUP_METHOD,
  KEYBOARD,
  STYLE_VARIABLE,
  POPUP_ENABLED,
  LINK_COMMAND_ENABLED,
} from '@/const'

import type { SettingsType, FolderOption } from '@/types'
import { Icon } from '@/components/Icon'
import { useEventProxy } from '@/hooks/option/useEventProxy'
import { isMac } from '@/lib/utils'

import css from './SettingForm.module.css'

type folderOptionsType = {
  enumNames: string[]
  enum: FolderOption[]
  iconUrl: string
}

type Translation = {
  [key: string]: string
}

type StartupMethodMap = Record<STARTUP_METHOD, { [key: string]: string }>
type KeyboardMap = Record<KEYBOARD, { [key: string]: string }>
type ModeMap = Record<OPEN_MODE, { [key: string]: string }>
type DragOpenModeMap = Record<DRAG_OPEN_MODE, { [key: string]: string }>
type PopupEnabledMap = Record<POPUP_ENABLED, { [key: string]: string }>
type LinkCommandEnabledMap = Record<
  LINK_COMMAND_ENABLED,
  { [key: string]: string }
>

const toKey = (str: string) => {
  return str.replace(/-/g, '_')
}

const toCommandId = (id: string) => {
  return Number(id.split('_')[2])
}

export function SettingFrom() {
  const [parent, setParent] = useState<MessageEventSource>()
  const [origin, setOrigin] = useState('')
  const [trans, setTrans] = useState<Translation>({})
  const [settingData, setSettingData] = useState<SettingsType>()
  const [timeoutID, setTimeoutID] = useState<number>()
  const settingRef = useRef<SettingsType>()
  const formRef = useRef<Form>(null)

  const sendMessage = useCallback(
    (command: OPTION_MSG, value: any) => {
      if (parent != null) {
        console.debug('sendMessage:', command, value)
        parent.postMessage({ command, value }, origin)
      }
    },
    [parent, origin],
  )

  const t = (key: string) => {
    return trans[`Option_${key}`]
  }

  const jump = (_hash: string) => {
    const hash = _hash ?? document.location.hash
    if (!hash) return
    const menu = document.querySelector(hash)
    menu?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const updateSettingData = (data: SettingsType) => {
    if (settingData == null) return
    console.log('updateSettingData', data.commands.length)
    setSettingData(data)
    // For some reason, updating data here does not update the Form display.
    // So update via ref.
    formRef.current?.setState({ formData: data })
  }

  useEventProxy(sendMessage, settingData)

  // Save after 500 ms to storage.
  useEffect(() => {
    let unmounted = false
    if (timeoutID) clearTimeout(timeoutID)
    const newTimeoutId = window.setTimeout(() => {
      if (unmounted) return
      if (settingRef.current) {
        sendMessage(OPTION_MSG.CHANGED, settingData)
      }
      settingRef.current = settingData
      setTimeoutID(undefined)
    }, 1 * 500 /* ms */)
    setTimeoutID(newTimeoutId)

    return () => {
      unmounted = true
      clearTimeout(timeoutID)
    }
  }, [settingData])

  useEffect(() => {
    const func = (event: MessageEvent) => {
      const command = event.data.command
      const value = event.data.value
      console.debug('recv message', command, value)
      if (command === OPTION_MSG.START) {
        const { settings, translation } = value
        if (event.source != null) {
          setParent(event.source)
          setOrigin(event.origin)
          console.log('start', settings)
          setSettingData(settings)
          setTrans(translation)
          // Page scrolls to the hash.
          setTimeout(jump, 10)
        }
      } else if (command === OPTION_MSG.RES_FETCH_ICON_URL) {
        const { iconUrl, searchUrl } = value
        if (!settingData) return
        const commands = settingData.commands.map((cmd) => {
          if (cmd.searchUrl === searchUrl) {
            cmd.iconUrl = iconUrl
          }
          return cmd
        })
        const newSettings = { ...settingData, commands }
        setSettingData(newSettings)
        formRef.current?.setState({ formData: newSettings })
      } else if (command === OPTION_MSG.JUMP) {
        const { hash } = value
        jump(hash)
      }
    }
    window.addEventListener('message', func)
    return () => {
      window.removeEventListener('message', func)
    }
  }, [settingData])

  const onChangeForm = (arg: IChangeEvent, id?: string) => {
    const data = arg.formData as SettingsType
    // Remove unnecessary fields when openMode is not popup or tab or window.
    if (id?.endsWith('openMode')) {
      data.commands
        .filter(
          (c) =>
            c.openMode !== OPEN_MODE.POPUP &&
            c.openMode !== OPEN_MODE.WINDOW &&
            c.openMode !== OPEN_MODE.TAB,
        )
        .map((c) => {
          delete c.openModeSecondary
          delete c.spaceEncoding
        })
      data.commands
        .filter(
          (c) =>
            c.openMode !== OPEN_MODE.POPUP &&
            c.openMode !== OPEN_MODE.WINDOW &&
            c.openMode !== OPEN_MODE.LINK_POPUP,
        )
        .map((c) => {
          delete c.popupOption
        })
    }

    // If popup-delay is not set
    // when the keyInput or leftClickHold is selected, set 0 ms.
    if (id?.endsWith('method')) {
      if (
        data.startupMethod.method === STARTUP_METHOD.KEYBOARD ||
        data.startupMethod.method === STARTUP_METHOD.LEFT_CLICK_HOLD
      ) {
        let userStyles = data.userStyles
        if (!userStyles.find((s) => s.name === STYLE_VARIABLE.POPUP_DELAY)) {
          userStyles.push({ name: STYLE_VARIABLE.POPUP_DELAY, value: '0' })
        }
        updateSettingData({
          ...data,
          userStyles,
        })
        return
      }
    }

    // update iconURL when searchUrl chagned
    if (id?.endsWith('searchUrl')) {
      const command = data.commands[toCommandId(id)]
      updateSettingData(data)
      sendMessage(OPTION_MSG.FETCH_ICON_URL, {
        searchUrl: command.searchUrl,
        settings: data,
      })
      return
    }
    updateSettingData(data)
  }

  const autofill = (cmdIdx: number) => {
    const searchUrl = settingData?.commands[cmdIdx].searchUrl
    if (!searchUrl) return
    sendMessage(OPTION_MSG.FETCH_ICON_URL, {
      searchUrl: searchUrl,
    })
  }

  const fields: RegistryFieldsType = {
    '#/startupMethod/method': SelectField,
    '#/startupMethod/param/keyboard': SelectField,
    '#/startupMethod/param/leftClickHold': InputNumberField,
    '#/popupPlacement': SelectField,
    '#/style': SelectField,
    '#/commands/iconUrl': IconUrlFieldWithAutofill(autofill),
    '#/commands/fetchOptions': FetchOptionField,
    '#/commands/openMode': SelectField,
    '#/commands/copyOption': SelectField,
    '#/commands/parentFolderId': FolderField,
    '#/commandFolder/iconUrl': IconUrlField,
    '#/commandFolder/onlyIcon': CheckboxField,
    '#/linkCommand/enabled': SelectField,
    '#/linkCommand/openMode': SelectField,
    '#/linkCommand/threshold': InputNumberField,
    '#/linkCommand/showIndicator': CheckboxField,
    '#/pageRules/popupEnabled': SelectField,
    '#/pageRules/popupPlacement': SelectField,
    '#/pageRules/linkCommandEnabled': SelectField,
    '#/styleVariable': UserStyleField,
    ArraySchemaField: CustomArraySchemaField,
  }
  for (const type of [OPEN_MODE.POPUP, OPEN_MODE.WINDOW, OPEN_MODE.TAB]) {
    fields[`#/commands/openModeSecondary_${type}`] = SelectField
    fields[`#/commands/spaceEncoding_${type}`] = SelectField
  }

  const uiSchema = {
    startupMethod: {
      'ui:title': t('startupMethod'),
      'ui:description': t('startupMethod_desc'),
      method: {
        'ui:title': t('startupMethod_method'),
        enum: {} as StartupMethodMap,
      },
      keyboardParam: {
        'ui:classNames': 'startupMethodParam',
        'ui:title': t('startupMethod_param_keyboard'),
        enum: {} as KeyboardMap,
      },
      leftClickHoldParam: {
        'ui:classNames': 'startupMethodParam',
        'ui:title': t('startupMethod_param_leftClickHold'),
      },
    },
    popupPlacement: {
      'ui:classNames': 'popupPlacement',
      'ui:title': t('popupPlacement'),
      'ui:disabled': false,
    },
    style: {
      'ui:classNames': 'style',
      'ui:title': t('style'),
      'ui:disabled': false,
      enum: {
        vertical: { 'ui:title': t('style_vertical') },
        horizontal: { 'ui:title': t('style_horizontal') },
      },
    },
    commands: {
      'ui:title': t('commands'),
      'ui:description': `${t('searchUrl')}: ${t('commands_desc')} \n${settingData?.commands.length}${t('commands_desc_count')}`,
      items: {
        'ui:classNames': 'commandItem',
        'ui:order': [
          'title',
          'openMode',
          'openModeSecondary',
          'searchUrl',
          'iconUrl',
          'parentFolderId',
          '*',
        ],
        popupOption: { 'ui:widget': 'hidden' },
        title: { 'ui:title': t('title') },
        searchUrl: {
          'ui:title': t('searchUrl'),
        },
        spaceEncoding: {
          'ui:title': t('spaceEncoding'),
          enum: {
            plus: { 'ui:title': t('spaceEncoding_plus') },
            percent: { 'ui:title': t('spaceEncoding_percent') },
          },
        },
        iconUrl: {
          'ui:title': t('iconUrl'),
          'ui:button': t('iconUrl_autofill'),
        },
        openMode: {
          'ui:title': t('openMode'),
          enum: {} as ModeMap,
        },
        openModeSecondary: {
          'ui:title': t('openModeSecondary'),
          enum: {
            popup: { 'ui:title': t('openMode_popup') },
            tab: { 'ui:title': t('openMode_tab') },
          },
        },
        parentFolderId: { 'ui:title': t('parentFolderId') },
        fetchOptions: { 'ui:title': t('fetchOptions') },
        copyOption: {
          'ui:title': t('copyOption'),
          enum: {
            default: { 'ui:title': t('copyOption_default') },
            text: { 'ui:title': t('copyOption_text') },
          },
        },
        variables: {
          'ui:classNames': 'variables',
          'ui:title': t('variables'),
          items: {
            'ui:classNames': 'variableItem',
          },
        },
      },
    },
    linkCommand: {
      'ui:title': t('linkCommand'),
      'ui:description': t('linkCommand_desc'),
      'ui:order': ['enabled', 'openMode', 'threshold', 'showIndicator'],
      enabled: {
        'ui:title': t('linkCommandEnabled'),
        'ui:classNames': 'linkCommandEnabled',
        enum: {} as LinkCommandEnabledMap,
      },
      openMode: {
        'ui:title': t('openMode'),
        'ui:classNames': 'linkCommandOpenMode',
        enum: {} as DragOpenModeMap,
      },
      threshold: {
        'ui:title': t('threshold'),
        'ui:description': t('threshold_desc'),
        'ui:classNames': 'linkCommandThreshold',
      },
      showIndicator: {
        'ui:title': t('showIndicator'),
        'ui:description': t('showIndicator_desc'),
        'ui:classNames': 'linkCommandShowIndicator',
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
        popupEnabled: {
          'ui:title': t('popupEnabled'),
          enum: {} as PopupEnabledMap,
        },
        popupPlacement: { 'ui:title': t('popupPlacement') },
        linkCommandEnabled: {
          'ui:title': t('linkCommandEnabled'),
          enum: {} as LinkCommandEnabledMap,
        },
      },
    },
    userStyles: {
      'ui:title': t('userStyles'),
      'ui:description': t('userStyles_desc'),
      items: {
        'ui:classNames': 'userStyles',
        name: {
          'ui:title': t('userStyles_name'),
          enum: {} as UserStyleMap,
        },
        value: { 'ui:title': t('userStyles_value') },
      },
    },
    AddButton: {
      'ui:title': t('Add'),
    },
  }

  // Add folder options to schema.
  if (settingData) {
    const folders = settingData.folders
    const folderOptions: folderOptionsType = folders.reduce(
      (acc, cur) => {
        acc.enumNames.push(cur.title)
        acc.enum.push({
          id: cur.id,
          name: cur.title,
          iconUrl: cur.iconUrl ?? '',
        })
        return acc
      },
      {
        enumNames: ['-- none --'],
        enum: [{ id: '', name: '-- none --' }],
      } as folderOptionsType,
    )
    settingSchema.definitions.folderOptions = folderOptions
  }

  // Add startupMethod to schema and uiSchema.
  const method = settingData?.startupMethod.method
  const methods = Object.values(STARTUP_METHOD)
  const methodMap = {} as StartupMethodMap
  for (const m of methods) {
    methodMap[m] = {
      'ui:title': t(`startupMethod_${m}`),
    }
  }
  settingSchema.definitions.startupMethodEnum.enum = methods
  uiSchema.startupMethod.method.enum = methodMap
  if (method === STARTUP_METHOD.CONTEXT_MENU) {
    uiSchema.popupPlacement['ui:disabled'] = true
    uiSchema.style['ui:disabled'] = true
  }
  // Key name per OS
  const keyboardMap = {} as KeyboardMap
  let os = isMac() ? 'mac' : 'windows'
  for (const k of Object.values(KEYBOARD)) {
    keyboardMap[k] = {
      'ui:title': t(`keyboardParam_${k}_${os}`),
    }
  }
  uiSchema.startupMethod.keyboardParam.enum = keyboardMap

  // Add openModes to schema and uiSchema.
  const modes = Object.values(OPEN_MODE).filter(
    (mode) => mode !== OPEN_MODE.OPTION && mode !== OPEN_MODE.ADD_PAGE_RULE,
  )
  const modeMap = {} as ModeMap
  for (const mode of modes) {
    modeMap[mode] = {
      'ui:title': t(`openMode_${mode}`),
    }
  }
  settingSchema.definitions.openMode.enum = modes
  uiSchema.commands.items.openMode.enum = modeMap

  // Add linkCommand's openMode to uiSchema.
  const dragOpenModeMap = {} as DragOpenModeMap
  for (const mode of Object.values(DRAG_OPEN_MODE)) {
    dragOpenModeMap[mode] = {
      'ui:title': t(`openMode_${mode}`),
    }
  }
  uiSchema.linkCommand.openMode.enum = dragOpenModeMap

  const popupEnabledMap = {} as PopupEnabledMap
  for (const option of Object.values(POPUP_ENABLED)) {
    popupEnabledMap[option] = {
      'ui:title': t(option),
    }
  }
  uiSchema.pageRules.items.popupEnabled.enum = popupEnabledMap

  const linkCommandEnabledMap = {} as LinkCommandEnabledMap
  for (const option of Object.values(LINK_COMMAND_ENABLED)) {
    if (option === LINK_COMMAND_ENABLED.INHERIT) {
      linkCommandEnabledMap[option] = {
        'ui:title':
          t(`linkCommand_enabled${option}`) +
          ': ' +
          t(`linkCommand_enabled${settingData?.linkCommand.enabled}`),
      }
      continue
    }
    linkCommandEnabledMap[option] = {
      'ui:title': t(`linkCommand_enabled${option}`),
    }
  }
  uiSchema.linkCommand.enabled.enum = linkCommandEnabledMap
  uiSchema.pageRules.items.linkCommandEnabled.enum = linkCommandEnabledMap

  // Add userStyles to schema and uiSchema.
  const sv = Object.values(STYLE_VARIABLE)
  const used = settingData?.userStyles?.map((s) => s.name) ?? []
  const svMap = {} as UserStyleMap
  for (const s of sv) {
    svMap[s] = {
      'ui:title': t(`userStyles_option_${toKey(s)}`),
      'ui:description': t(`userStyles_desc_${toKey(s)}`),
      used: used.includes(s) ? 'used' : '',
    }
  }

  settingSchema.definitions.styleVariable.properties.name.enum = sv
  uiSchema.userStyles.items.name.enum = svMap

  const log = (type: any) => console.log.bind(console, type)
  return (
    <Form
      className={css.form}
      schema={settingSchema}
      validator={validator}
      formData={settingData}
      onChange={onChangeForm}
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
      experimental_defaultFormStateBehavior={{
        mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined',
      }}
      ref={formRef}
    />
  )
}

function AddButton(props: IconButtonProps) {
  const { icon, uiSchema, ...btnProps } = props
  return (
    <button type="button" {...btnProps} className={css.button}>
      <Icon name="plus" />
      <span>Add</span>
    </button>
  )
}

function MoveUpButton(props: IconButtonProps) {
  const { icon, uiSchema, ...btnProps } = props
  return (
    <button type="button" {...btnProps} className={css.buttonItems}>
      <Icon name="arrow-up" />
    </button>
  )
}

function MoveDownButton(props: IconButtonProps) {
  const { icon, uiSchema, ...btnProps } = props
  return (
    <button type="button" {...btnProps} className={css.buttonItems}>
      <Icon name="arrow-down" />
    </button>
  )
}

function RemoveButton(props: IconButtonProps) {
  const { icon, uiSchema, ...btnProps } = props
  return (
    <button
      type="button"
      {...btnProps}
      className={clsx(css.buttonItems, css.buttonItemsDanger)}
    >
      <Icon name="delete" />
    </button>
  )
}

const IconUrlField = (props: FieldProps) => {
  return (
    <label className={`${css.iconUrl} form-control`}>
      {props.formData && (
        <img
          className={css.iconUrlPreview}
          src={props.formData}
          alt="icon preview"
        />
      )}
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

const IconUrlFieldWithAutofill =
  (onClick: (cmdIdx: number) => void) => (props: FieldProps) => {
    const btnLabel = props.uiSchema ? props.uiSchema['ui:button'] : 'autofill'
    const cmdIdx = toCommandId(props.idSchema.$id)
    const [clicked, setClicked] = useState(false)

    const exec = () => {
      onClick(cmdIdx)
      setClicked(true)
      setTimeout(() => setClicked(false), 5000)
    }

    return (
      <>
        <IconUrlField {...props} />
        {!props.formData && (
          <button
            type="button"
            className={css.iconUrlAutoFill}
            onClick={exec}
            disabled={clicked}
          >
            {clicked ? (
              <Icon name="refresh" className={css.iconUrlAutoFillLoading} />
            ) : (
              btnLabel
            )}
          </button>
        )}
      </>
    )
  }

type Option = {
  name: string
  value: string
}

const InputNumberField = (props: FieldProps) => {
  const { formData, idSchema, required, schema } = props
  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    props.onChange(Number(event.target.value))
  }
  return (
    <label className={clsx(css.selectContainer, 'form-control')}>
      <input
        id={idSchema.$id}
        className={css.number}
        value={formData ?? schema.default}
        required={required}
        onChange={onChange}
        type="number"
        max={schema.maximum}
        min={schema.minimum}
        step={schema.step}
      />
    </label>
  )
}

const SelectField = (props: FieldProps) => {
  const { formData, schema, uiSchema, required } = props
  const options = schema.enum.map((e: string) => {
    const name = uiSchema?.enum?.[e] ? uiSchema.enum[e]['ui:title'] : e
    return { name, value: e }
  })
  if (!required) {
    options.unshift({ name: '-- none --', value: '' })
  }
  const onChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    props.onChange(event.target.value)
  }
  return (
    <label className={clsx(css.selectContainer, 'form-control')}>
      <select
        id={props.idSchema.$id}
        className={css.select}
        value={formData}
        onChange={onChange}
        required={props.required}
        disabled={props.disabled}
      >
        {options.map((option: Option) => (
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
    props.onChange(event.target.value)
  }

  const folder = registry.rootSchema.definitions.folderOptions.enum.find(
    (e) => e.id === formData,
  )

  return (
    <label className={clsx(css.selectContainer, 'form-control')}>
      {folder?.iconUrl && (
        <img
          className={css.iconUrlPreview}
          src={folder.iconUrl}
          alt="icon preview"
        />
      )}
      <select
        id={props.idSchema.$id}
        className={css.select}
        value={formData}
        required={props.required}
        onChange={onChange}
      >
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
    <label className="form-control">
      <textarea
        id={props.idSchema.$id}
        className={css.fetchOptionInput}
        value={props.formData}
        required={props.required}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </label>
  )
}

const CheckboxField = (props: FieldProps) => {
  let title = props.name
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

const CustomArraySchemaField = (props: FieldProps) => {
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
