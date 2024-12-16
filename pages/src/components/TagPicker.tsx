'use client'

import React, { useState, useRef } from 'react'
import { Check, Plus } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import * as Popover from '@radix-ui/react-popover'

import { getTags } from '@/features/tag'
import { generateUUIDFromObject } from '@/lib/utils'

import type { Tag } from '@/types'

type Props = {
  value?: Tag
  onSelect: (value: Tag) => void
  excludeIds?: string[]
  containerRef: React.RefObject<HTMLDivElement>
}

function tagIncludes(tag: Tag, ids: string[] | undefined): boolean {
  if (!ids) return false
  return ids.some((id) => id === tag.id)
}

export function TagPicker(props: Props): JSX.Element {
  const [open, setOpen] = useState(false)
  const [tagId, setTagId] = useState<string | undefined>(props.value?.id)
  const [input, setInput] = useState<string | undefined>()
  const emptyRef = useRef<HTMLDivElement>(null)
  const createEnalbe = input && input.length > 2

  const tags = getTags().filter((tag) => !tagIncludes(tag, props.excludeIds))

  const findByName = (name: string | undefined): Tag => {
    const t = tags.find((tag) => tag.name === name)
    if (!t) throw new Error(`Tag not found: ${name}`)
    return t
  }

  const findById = (id: string | undefined): Tag | undefined => {
    return tags.find((tag) => tag.id === id)
  }

  const tagName = findById(tagId)?.name

  const create = (name: string) => {
    if (!createEnalbe) return
    console.log('create', input)
    props.onSelect({
      id: generateUUIDFromObject({ name }),
      name,
    })
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && emptyRef.current && input) {
      create(input)
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen} modal={true}>
      <Popover.Trigger asChild>
        <Badge
          role="combobox"
          aria-expanded={open}
          variant="outline"
          className="shadow-sm py-[5px] mt-[-1px] cursor-pointer bg-white hover:bg-stone-100 text-stone-600"
        >
          <Plus size={16} />
          Add
        </Badge>
      </Popover.Trigger>

      <Popover.Portal container={props.containerRef.current}>
        <Popover.Content className="p-0 z-50 rounded-md border bg-popover text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
          <Command>
            <CommandInput
              placeholder="Search tag..."
              className="h-9"
              onValueChange={setInput}
              onKeyDown={onKeyDown}
            />
            <CommandList>
              <CommandEmpty
                ref={emptyRef}
                className={cn(createEnalbe && 'cursor-pointer')}
                onClick={() => create(input as string)}
              >
                {createEnalbe ? (
                  <p>
                    <span className="font-semibold">{input}</span> を作りますか?
                  </p>
                ) : (
                  '見つかりません'
                )}
              </CommandEmpty>
              <CommandGroup>
                {tags.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={option.name}
                    onSelect={(name) => {
                      setTagId(name === tagName ? '' : findByName(name).id)
                      props.onSelect(findByName(name))
                      setOpen(false)
                    }}
                  >
                    {option.name}
                    <Check
                      className={cn(
                        'ml-auto',
                        tagId === option.id ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}