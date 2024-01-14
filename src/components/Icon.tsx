import React from 'react'
import classnames from 'classnames'
import { icon } from './Icon.module.css'

type Props = {
  name: string
  className?: string
  sandbox?: boolean
}

export function Icon(props: Props): JSX.Element {
  let href = `/icons.svg#icon-${props.name}`
  if (props.sandbox) {
    href = `#icon-${props.name}`
  }

  return (
    <svg className={classnames(icon, props.className)}>
      <use xlinkHref={href} />
    </svg>
  )
}
