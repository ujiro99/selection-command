import React from 'react'
import styles from './TableOfContents.module.css'
import { t } from '@/services/i18n'
import { Rocket, SquareTerminal, Eye, BookOpen, Paintbrush } from 'lucide-react'

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
            <Icon name={p} size={20} className="mr-2 stroke-gray-600" />
            <span>{labels[p]}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

const Icon = ({
  name,
  size,
  className,
}: {
  name: string
  size: number
  className: string
}) => {
  switch (name) {
    case 'startupMethod':
      return <Rocket size={size} className={className} />
    case 'commands':
      return <SquareTerminal size={size} className={className} />
    case 'linkCommand':
      return <Eye size={size} className={className} />
    case 'pageRules':
      return <BookOpen size={size} className={className} />
    case 'userStyles':
      return <Paintbrush size={size} className={className} />
    default:
      return null
  }
}
