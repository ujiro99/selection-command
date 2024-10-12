import React from 'react'
import type { FieldProps } from '@rjsf/utils'

import { STYLE_VARIABLE } from '@/const'

import {
  container,
  select,
  styleVariable,
  value,
  description,
} from './UserStyleField.module.css'

export type UserStyleMap = Record<STYLE_VARIABLE, { [key: string]: string }>

type AttributesType = {
  type: 'string' | 'number' | 'color'
  default: string | number
  max?: number
  min?: number
  step?: number
}

type AttributeMap = Record<STYLE_VARIABLE, AttributesType>

const Attributes: AttributeMap = {
  [STYLE_VARIABLE.BACKGROUND_COLOR]: {
    type: 'color',
    default: '#FFFFFF',
  },
  [STYLE_VARIABLE.BORDER_COLOR]: {
    type: 'color',
    default: '#F3F4F6',
  },
  [STYLE_VARIABLE.FONT_SCALE]: {
    type: 'number',
    default: 1,
    max: 3,
    min: 0.5,
    step: 0.1,
  },
  [STYLE_VARIABLE.IMAGE_SCALE]: {
    type: 'number',
    default: 1,
    max: 3,
    min: 0.5,
    step: 0.1,
  },
  [STYLE_VARIABLE.PADDING_SCALE]: {
    type: 'number',
    default: 1,
    max: 3,
    min: 0.5,
    step: 0.1,
  },
  [STYLE_VARIABLE.POPUP_DELAY]: {
    type: 'number',
    default: 250,
    max: 1000,
    min: 0,
    step: 10,
  },
  [STYLE_VARIABLE.POPUP_DURATION]: {
    type: 'number',
    default: 100,
    max: 1000,
    min: 0,
    step: 10,
  },
}

export function UserStyleField(props: FieldProps) {
  const { formData, uiSchema } = props
  const options = Object.entries(uiSchema?.name.enum as UserStyleMap)
    .filter(([key, obj]) => obj.used !== 'used' || key === formData?.name)
    .map(([key, obj]) => ({
      key,
      name: obj['ui:title'],
      desc: obj['ui:description'],
    }))
  options.unshift({ key: '', name: '-- none --', desc: '' })
  const desc = options.find((o) => o.key === formData?.name)?.desc
  const attr = Attributes[formData?.name as STYLE_VARIABLE] ?? {
    type: 'string',
  }

  const onChangeName = (event: React.ChangeEvent<HTMLSelectElement>) => {
    props.onChange({
      ...formData,
      name: event.target.value,
    })
  }

  const onChangeValue = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value
    if (event.target.type === 'color') {
      value = value.toUpperCase()
    }
    props.onChange({ ...formData, value })
  }

  return (
    <div className={container}>
      <div className={styleVariable}>
        <select
          id={props.idSchema.$id}
          className={select}
          value={formData?.name}
          required={props.required}
          onChange={onChangeName}
        >
          {options.map((option) => (
            <option key={option.key} value={option.key}>
              {option.name}
            </option>
          ))}
        </select>
        {formData?.name ? (
          <input
            type={attr.type}
            id={props.idSchema.$id}
            className={value}
            value={formData?.value ?? attr.default}
            required={props.required}
            placeholder={`e.g. ${attr.default}`}
            max={attr.max}
            min={attr.min}
            step={attr.step}
            onChange={onChangeValue}
          />
        ) : (
          <span className={value} />
        )}
      </div>
      <p className={description}>
        <span>{desc}</span>
      </p>
    </div>
  )
}
