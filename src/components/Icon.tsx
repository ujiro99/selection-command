import React from 'react'
import styles from './Icon.module.css'

type Props = {
  name: string
  className?: string
}

export function Icon(props: Props): JSX.Element {
  const href = `#icon-${props.name}`

  const className = props.className ?? styles.icon

  return (
    <svg className={className}>
      <use xlinkHref={href} />
    </svg>
  )
}
