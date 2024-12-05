import React from 'react'
import styles from './Icon.module.css'

type Props = {
  name: string
  className?: string
  style?: React.CSSProperties
}

export function Icon(props: Props): JSX.Element {
  const href = `#icon-${props.name}`

  const className = props.className ?? styles.icon

  return (
    <svg className={className} style={props.style}>
      <use xlinkHref={href} />
    </svg>
  )
}
