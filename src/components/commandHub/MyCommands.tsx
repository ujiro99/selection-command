import React, { useState, useEffect } from 'react'
import ColorThief from 'colorthief'
import { useSetting } from '@/hooks/useSetting'
import { isEmpty, cn } from '@/lib/utils'
import { HUB_URL } from '@/const'
import type { Command } from '@/types'

export const MyCommands = (): JSX.Element => {
  const [urls, setUrls] = useState<string[]>([])
  const { settings, iconUrls } = useSetting()
  const commands = settings.commands
    .filter((c) => !isEmpty(c.searchUrl))
    .filter((c) => !urls.includes(c.searchUrl))
    .map((c) => ({ ...c, iconDataUrl: c.iconUrl, iconUrl: iconUrls[c.id] }))
  const enableMarquee = commands.length > 4

  useEffect(() => {
    fetch(`${HUB_URL}/api/searchUrls`)
      .then((res) => res.json())
      .then((data) => {
        setUrls(data)
      })
  }, [])

  return (
    <div className="relative pt-1 px-4">
      <p className="text-sm text-stone-700">
        ⚡️作成したコマンドを自動入力できます。
      </p>
      <div
        className={cn(
          'flex flex-row relative h-[60px] overflow-hidden group',
          'before:absolute before:inset-0 before:z-[1] before:bg-gradient-to-r before:from-stone-50 before:to-transparent before:w-10 before:pointer-events-none',
          'after:absolute after:inset-y-0 after:right-0 after:z-[1] after:bg-gradient-to-l after:from-stone-50 after:to-transparent after:w-10 after:pointer-events-none',
        )}
      >
        <CommandList
          commands={commands}
          className={cn('absolute group-hover:animate-pause', {
            'animate-marquee': enableMarquee,
          })}
        />
        <CommandList
          commands={commands}
          className={cn('absolute group-hover:animate-pause', {
            'animate-marquee2': enableMarquee,
          })}
        />
      </div>
    </div>
  )
}

type CommandWithIconDataUrl = Command & { iconDataUrl: string }

type CommandListProps = {
  commands: CommandWithIconDataUrl[]
  className?: string
}
const CommandList = (props: CommandListProps): JSX.Element => {
  return (
    <ul className={cn('flex gap-2 p-1', props.className)}>
      {props.commands.map((c) => {
        return <ListItem key={c.id} command={c} />
      })}
    </ul>
  )
}

type ItemProps = {
  command: CommandWithIconDataUrl
}
const ListItem = (props: ItemProps): JSX.Element => {
  const c = props.command
  const [imgElm, setImgElm] = useState<HTMLImageElement | null>(null)
  const [liElm, setLiElm] = useState<HTMLLIElement | null>(null)

  useEffect(() => {
    if (imgElm == null) return
    imgElm.onload = () => {
      const colorThief = new ColorThief()
      const dominantColor = colorThief.getColor(imgElm) // [R, G, B]
      const paletteColors = colorThief.getPalette(imgElm, 2)
      const color1 = `rgba(${dominantColor.join(',')}, 0.04)`
      const color2 = `rgba(${paletteColors[0].join(',')}, 0.1)`
      if (liElm != null) {
        liElm.style.background = `linear-gradient(155deg, white 30%, ${color1} 60%, ${color2})`
      }
    }
  }, [imgElm])

  const onClick = () => {
    // Send a message to Commad Hub.
    window.postMessage({ action: 'InsertCommand', data: c }, '*')
  }

  return (
    <li
      key={c.id}
      ref={setLiElm}
      className="rounded-md shadow bg-white hover:opacity-70"
    >
      <button className="flex items-center gap-2 p-2" onClick={onClick}>
        <img
          src={c.iconDataUrl}
          alt={c.title}
          ref={setImgElm}
          className="h-7 w-7"
        />
        <div className="text-left w-28 overflow-hidden">
          <p className="text-sm font-semibold text-stone-500 truncate leading-4 mt-0.5">
            {c.title}
          </p>
          <p className="text-xs text-stone-600 truncate leading-4 mt-0.5">
            {c.searchUrl}
          </p>
        </div>
      </button>
    </li>
  )
}
