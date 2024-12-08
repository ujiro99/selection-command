'use client'

import React, { useState } from 'react'
import { ChevronDown, ArrowDownToLine } from 'lucide-react'
import { Image } from '@/components/Image'
import { Details } from '@/components/Details'
import { Badge } from '@/components/ui/badge'
import type { Command } from '@/types'

type Props = {
  cmd: Command
}

export function ListItem(props: Props): JSX.Element {
  const { cmd } = props
  const [open, setOpen] = useState(true)

  const onClickDetail = () => {
    setOpen(!open)
  }

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
          <p className="text-base text-stone-500 text-sm">{cmd.searchUrl}</p>
          <p className="text-base">{cmd.description}</p>
        </div>
        <div className="flex items-center">
          <ChevronDown
            onClick={onClickDetail}
            className="p-0.5 text-stone-500 hover:bg-stone-200 rounded cursor-pointer"
            size={28}
          />
          <button className="flex items-center  text-stone-500 hover:bg-stone-200 rounded ">
            <ArrowDownToLine className="p-1" size={28} />
            <span className="p-1 pl-0 select-none">{cmd.download}</span>
          </button>
        </div>
      </div>
      <Details open={open} onOpenChange={setOpen} command={cmd} className="" />
      <ul className="mt-3 flex gap-2">
        {cmd.tags.map((tag) => (
          <li key={tag.id}>
            <Badge className="bg-stone-200 hover:bg-stone-300 text-stone-800 select-none">
              {tag.name}
            </Badge>
          </li>
        ))}
      </ul>
    </>
  )
}
