import React from 'react'
import { ArrowDownToLine } from 'lucide-react'
import { Image } from '@/components/Image'
import { Tag } from '@/components/Tag'
import type { Command } from '@/types'
import { cmd2text } from '@/features/command'

type Props = {
  cmd: Command
}

export function ListItem(props: Props): JSX.Element {
  const { cmd } = props
  return (
    <>
      <div className="text-left flex flex-row">
        <div className="flex-1">
          <p className="text-lg flex flex-row">
            <Image
              src={cmd.iconUrl}
              alt={cmd.title}
              className="inline-block w-7 h-7 mr-2"
            />
            {cmd.title}
          </p>
          <p className="text-base text-sm text-stone-500">{cmd.searchUrl}</p>
          <p className="text-base">{cmd.description}</p>
        </div>
        <div className="flex items-center text-stone-600">
          <p
            className="hidden px-2 py-0.5 bg-stone-200 rounded-md"
            data-id={cmd.id}
          >
            <span className="select-none">Installed</span>
          </p>
          <button
            className="hidden hover:bg-stone-200 rounded"
            data-id={cmd.id}
            data-command={cmd2text(cmd)}
          >
            <ArrowDownToLine className="p-1" size={28} />
          </button>
          <span className="ml-2 p-1 pl-0 select-none">{cmd.download}</span>
        </div>
      </div>
      <ul className="mt-2 flex gap-2">
        {cmd.tags.map((tag) => (
          <li key={tag.id}>
            <Tag tag={tag} />
          </li>
        ))}
      </ul>
    </>
  )
}
