'use client'

import clsx from 'clsx'
import { SortOrder } from '@/components/SortOrder'
import { ListItem } from '@/components/ListItem'
import {
  CommandSorterProvider,
  useCommandSorter,
} from '@/hooks/useCommandSorter'

import { getCommands } from '@/features/command'
import { isEmpty } from '@/lib/utils'

import css from './CommandList.module.css'

type Props = {
  tagName?: string
}

export function CommandList(props: Props): JSX.Element {
  return (
    <CommandSorterProvider>
      <CommandListInner {...props} />
    </CommandSorterProvider>
  )
}

function CommandListInner(props: Props): JSX.Element {
  const { tagName } = props
  const { sort } = useCommandSorter()

  let commands = getCommands()

  if (!isEmpty(tagName)) {
    commands = commands.filter((c) => c.tags.some((t) => t.name === tagName))
  }

  commands = sort(commands)

  return (
    <div className="w-full">
      <SortOrder />
      <ul className="mt-2 w-full text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
        {commands.map((cmd) => (
          <li key={cmd.id} className={clsx('px-2 w-full', css.item)}>
            <ListItem cmd={cmd} />
          </li>
        ))}
      </ul>
    </div>
  )
}
