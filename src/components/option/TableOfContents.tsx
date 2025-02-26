import React from 'react'
import styles from './TableOfContents.module.css'
import { t } from '@/services/i18n'

type Props = {
  onClick: (hash: string) => void
}

export const TableOfContents = (props: Props) => {
  const properties = [
    'startupMethod',
    'commands',
    'linkCommand',
    'pageRules',
    'userStyles',
  ]
  const labels = properties.reduce(
    (a, p) => ({ ...a, [p]: t(`Option_${p}`) }),
    {},
  ) as Record<string, string>

  const onClick = (e: React.SyntheticEvent<HTMLButtonElement>) => {
    const target = e.currentTarget.dataset.target
    const hash = `#${target}`
    props.onClick(hash)
  }

  return (
    <ul className={styles.container}>
      <span className={styles.label}>Menu</span>
      {properties.map((p) => (
        <li className={styles.item} key={p}>
          <button className={styles.button} onClick={onClick} data-target={p}>
            <span>{labels[p]}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
