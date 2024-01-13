import React from 'react'
import styles from './LoadingIcon.module.css'

type LoadingIconProp = {
  children?: React.ReactNode
}

export function LoadingIcon(props: LoadingIconProp): JSX.Element {
  return (
    <div className={styles.LoadingIcon}>
      <div className={styles.icon} />
      <div className={styles.children}>{props.children}</div>
    </div>
  )
}
