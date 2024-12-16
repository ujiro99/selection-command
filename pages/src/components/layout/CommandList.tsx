import clsx from 'clsx'

import { getCommands } from '@/features/command'
import { ListItem } from '@/components/ListItem'
import css from './CommandList.module.css'

type Props = {
  tagName?: string
}

export function CommandList(props: Props): JSX.Element {
  const { tagName } = props
  let commands = getCommands()

  if (tagName) {
    commands = commands.filter((c) => c.tags.some((t) => t.name === tagName))
  }

  return (
    <ul className="w-full text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
      {commands.map((cmd) => (
        <li key={cmd.id} className={clsx('px-2', css.item)}>
          <ListItem cmd={cmd} />
        </li>
      ))}
    </ul>
  )
}
