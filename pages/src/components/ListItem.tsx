import React from 'react'
import Link from 'next/link'
import { ArrowDownToLine, Check, Star } from 'lucide-react'
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
      <div className="text-left flex flex-row items-center gap-1">
        <div className="flex-1 overflow-hidden space-y-1">
          <p className="text-lg flex flex-row">
            <Image
              src={cmd.iconUrl}
              alt={cmd.title}
              className="inline-block w-7 h-7 mr-2"
            />
            {cmd.title}
          </p>
          <p className="text-xs sm:text-sm text-stone-500 truncate">
            {cmd.searchUrl}
          </p>
          <p className="text-md sm:text-base">{cmd.description}</p>
        </div>
        <div className="flex gap-1">
          <div className="flex items-center text-stone-600">
            <div>
              <p className="hidden" data-id={cmd.id}>
                <Check className="p-1 stroke-sky-500" size={28} />
              </p>
              <button
                className="hidden hover:bg-stone-200 rounded transition"
                data-id={cmd.id}
                data-command={cmd2text(cmd)}
                data-gtm-click="install"
              >
                <ArrowDownToLine className="p-1" size={28} />
              </button>
            </div>
            <span
              className="pl-0.5 p-1 select-none"
              data-id={cmd.id}
              data-download-count={cmd.download}
            >
              {cmd.download.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center text-stone-600">
            <button
              className="hover:bg-stone-200 rounded transition duration-50"
              data-star-id={cmd.id}
              data-gtm-click="star"
            >
              <Star className="p-1 transition" size={28} />
            </button>
            <span
              className="pl-0.5 p-1 select-none"
              data-star-id={cmd.id}
              data-star-count={cmd.star}
            >
              {cmd.star.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
      <ul className="mt-2 flex gap-2 flex-wrap">
        {cmd.tags.map((tag) => (
          <li key={tag.id}>
            <Link href={`/tag/${tag.name}`}>
              <Tag tag={tag} />
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
