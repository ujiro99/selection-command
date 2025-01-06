'use client'

import { SortOrder } from '@/components/SortOrder'
import { ListItem } from '@/components/ListItem'
import {
  CommandSorterProvider,
  useCommandSorter,
} from '@/hooks/useCommandSorter'
import { getCommands } from '@/features/command'
import { cn, isEmpty } from '@/lib/utils'
import { LangProps } from '@/types'

import css from './CommandList.module.css'

type Props = LangProps & {
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
  const { tagName, lang } = props
  const { sort } = useCommandSorter()
  const loaded = sort != null

  let commands = getCommands()

  if (!isEmpty(tagName)) {
    commands = commands.filter((c) => c.tags.some((t) => t.name === tagName))
  }
  if (sort) {
    commands = sort(commands)
  }

  return (
    <div className="w-full">
      <SortOrder />
      <ul
        className={cn(
          'mt-2 w-full text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)] transition duration-50',
          !loaded && 'opacity-0',
        )}
      >
        {commands.map((cmd) => (
          <li key={cmd.id} className={cn('px-2 w-full', css.item)}>
            <ListItem lang={lang} cmd={cmd} />
          </li>
        ))}
      </ul>
    </div>
  )
}
