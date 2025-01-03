import React, { useState, useEffect } from 'react'
import { useSetting } from '@/hooks/useSetting'
import { isEmpty, cn } from '@/lib/utils'
import { HUB_URL } from '@/const'
import type { Command } from '@/types'

export const MyCommands = (): JSX.Element => {
  const [urls, setUrls] = useState<string[]>([])
  const { settings } = useSetting()
  const commands = settings.commands
    .filter((c) => !isEmpty(c.searchUrl))
    .filter((c) => !urls.includes(c.searchUrl))

  useEffect(() => {
    fetch(`${HUB_URL}/api/searchUrls`)
      .then((res) => res.json())
      .then((data) => {
        setUrls(data)
      })
  }, [])

  console.log(' 4')

  return (
    <div className="relative pt-1 px-4">
      <p className="text-sm text-stone-600">
        あなたが作ったコマンドを共有しませんか？
      </p>
      <div
        className={cn(
          'flex flex-row overflow-x-hidden relative',
          'before:absolute before:inset-0 before:z-[1] before:bg-gradient-to-r before:from-stone-50 before:to-transparent before:w-14 before:pointer-events-none',
          'after:absolute after:inset-y-0 after:right-0 after:z-[1] after:bg-gradient-to-l after:from-stone-50 after:to-transparent after:w-14 after:pointer-events-none',
        )}
      >
        <CommandList commands={commands} className="animate-marquee" />
        <CommandList
          commands={commands}
          className="animate-marquee2 absolute"
        />
      </div>
    </div>
  )
}

type CommandListProps = {
  commands: Command[]
  className?: string
}
const CommandList = (props: CommandListProps): JSX.Element => {
  return (
    <ul className={cn('flex gap-2 p-1', props.className)}>
      {props.commands.map((c) => {
        return (
          <li
            key={c.id}
            className="rounded-md bg-white shadow hover:opacity-80"
          >
            <button data-id={c.id} className="flex items-center gap-2 p-2">
              <img src={c.iconUrl} alt={c.title} className="h-7 w-7" />
              <div className="text-left w-28 overflow-hidden">
                <p className="text-sm font-semibold text-stone-500 truncate leading-4">
                  {c.title}
                </p>
                <p className="text-xs text-stone-500 truncate leading-4">
                  {c.searchUrl}
                </p>
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
