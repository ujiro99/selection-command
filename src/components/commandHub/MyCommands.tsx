import React, { useState, useEffect, useRef, forwardRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import ColorThief from "colorthief"
import { useSettingsWithImageCache } from "@/hooks/useSetting"
import { sendEvent, ANALYTICS_EVENTS } from "@/services/analytics"
import { t } from "@/services/i18n"
import { cn, isSearchCommand, isPageActionCommand } from "@/lib/utils"
import { HUB_URL, SCREEN } from "@/const"
import type { Command } from "@/types"

export const MyCommands = (): JSX.Element => {
  const [urls, setUrls] = useState<string[]>([])
  const [pageActionIds, setPageActionIds] = useState<string[]>([])
  const listRef = useRef<HTMLUListElement | null>(null)
  const list2Ref = useRef<HTMLUListElement | null>(null)
  const { commands: allCommands, iconUrls } = useSettingsWithImageCache()
  const commands = allCommands
    .filter(
      (c) =>
        (isSearchCommand(c) && !urls.includes(c.searchUrl as string)) ||
        (isPageActionCommand(c) && !pageActionIds.includes(c.id)),
    )
    .map((c) => ({
      ...c,
      iconDataUrl: iconUrls[c.id] || c.iconUrl,
      iconUrl: iconUrls[c.id],
    }))
  const loaded = urls.length > 0
  const enableMarquee = commands.length > 3

  useEffect(() => {
    fetch(`${HUB_URL}/data/searchUrls.json`)
      .then((res) => res.json())
      .then((data) => {
        setUrls(data)
      })
    fetch(`${HUB_URL}/data/pageActionIds.json`)
      .then((res) => res.json())
      .then((data) => {
        setPageActionIds(data)
      })
  }, [])

  const slide = (direction = true) => {
    const diff = direction ? 5000 : -5000 // refer --marquee-duration.
    const elm = listRef.current
    const elm2 = list2Ref.current
    if (elm == null || elm2 == null) return
    const a = elm.getAnimations()[0]
    if (a != null) {
      ;(a.currentTime as number) += diff
      if ((a.currentTime as number) < 0) {
        a.currentTime = 0
      }
    }
    const a2 = elm2.getAnimations()[0]
    if (a2 != null) {
      ;(a2.currentTime as number) += diff
      if ((a2.currentTime as number) < 0) {
        a2.currentTime = 0
      }
    }
  }

  if (!loaded) {
    return (
      <div className="pt-1 px-4">
        <p className="text-sm text-stone-700">Loading...</p>
        <div className="h-[60px]" />
      </div>
    )
  }

  return (
    <div className="relative pt-2 px-4">
      <p className="text-sm text-stone-700">{t("commnadHub_youcanshare")}</p>
      {!enableMarquee ? (
        <div
          className={cn(
            "flex flex-row relative h-[60px] overflow-hidden group transition duratioin-50",
          )}
        >
          <CommandList
            commands={commands}
            className="absolute group-hover:animate-pause marquee-var"
            style={
              { "--marquee-items": commands.length } as React.CSSProperties
            }
            ref={listRef}
          />
        </div>
      ) : (
        <div
          className={cn(
            "flex flex-row relative h-[60px] overflow-hidden group",
            "before:absolute before:inset-0 before:z-[1] before:bg-gradient-to-r before:from-stone-50 before:to-transparent before:w-12 before:pointer-events-none",
            "after:absolute after:inset-y-0 after:right-0 after:z-[1] after:bg-gradient-to-l after:from-stone-50 after:to-transparent after:w-12 after:pointer-events-none",
          )}
        >
          <button
            className={cn(
              "hidden absolute inset-0 left-[-5px] w-10 z-10 select-none items-center justify-start",
              "group-hover:flex",
              "group/button",
            )}
            onClick={() => slide(false)}
          >
            <ChevronLeft className="stroke-stone-400 group-hover/button:stroke-stone-700 group-hover/button:transition-all" />
          </button>
          <CommandList
            commands={commands}
            className="absolute group-hover:animate-pause marquee-var animate-marquee"
            style={
              { "--marquee-items": commands.length } as React.CSSProperties
            }
            ref={listRef}
          />
          <CommandList
            commands={commands}
            className="absolute group-hover:animate-pause marquee-var animate-marquee2"
            style={
              { "--marquee-items": commands.length } as React.CSSProperties
            }
            ref={list2Ref}
          />
          <button
            className={cn(
              "hidden absolute inset-y-0 right-[-5px] w-10 z-10 select-none items-center justify-end",
              "group-hover:flex",
              "group/button",
            )}
            onClick={() => slide()}
          >
            <ChevronRight className="stroke-stone-400 group-hover/button:stroke-stone-700 group-hover/button:transition-all" />
          </button>
        </div>
      )}
    </div>
  )
}

type CommandWithIconDataUrl = Command & { iconDataUrl: string }

type CommandListProps = {
  commands: CommandWithIconDataUrl[]
  className?: string
  style?: React.CSSProperties
}
const CommandList = forwardRef<HTMLUListElement, CommandListProps>(
  (props: CommandListProps, ref): JSX.Element => {
    return (
      <ul
        className={cn("flex gap-2 p-1", props.className)}
        style={props.style}
        ref={ref}
      >
        {props.commands.map((c) => {
          return <ListItem key={c.id} command={c} />
        })}
      </ul>
    )
  },
)

type ItemProps = {
  command: CommandWithIconDataUrl
}
const ListItem = (props: ItemProps): JSX.Element => {
  const c = props.command
  const [imgElm, setImgElm] = useState<HTMLImageElement | null>(null)
  const [liElm, setLiElm] = useState<HTMLLIElement | null>(null)

  const isPageAction = isPageActionCommand(c)

  useEffect(() => {
    if (imgElm == null) return
    imgElm.onload = () => {
      const colorThief = new ColorThief()
      const dominantColor = colorThief.getColor(imgElm) // [R, G, B]
      const paletteColors = colorThief.getPalette(imgElm, 2)
      const color1 = `rgba(${dominantColor.join(",")}, 0.04)`
      const color2 = `rgba(${paletteColors[0].join(",")}, 0.1)`
      if (liElm != null) {
        liElm.style.background = `linear-gradient(160deg, white 30%, ${color1} 60%, ${color2})`
      }
    }
  }, [imgElm])

  const onClick = () => {
    // Send a message to Commad Hub.
    window.postMessage({ action: "InsertCommand", data: c }, "*")
    sendEvent(
      ANALYTICS_EVENTS.COMMAND_SHARE_FORM,
      { event_label: "input-my-command" },
      SCREEN.COMMAND_FORM,
    )
  }

  return (
    <li
      key={c.id}
      ref={setLiElm}
      className="rounded-md shadow bg-white hover:opacity-70 transition"
    >
      <button
        className="w-[150px] flex items-center gap-2 p-2"
        onClick={onClick}
      >
        <img
          src={c.iconDataUrl}
          alt={c.title}
          ref={setImgElm}
          className="h-7 w-7"
        />
        <div className="text-left overflow-hidden">
          <p className="text-sm font-semibold text-stone-500 truncate leading-4 mt-0.5">
            {c.title}
          </p>
          <p className="text-xs text-stone-600 truncate leading-4 mt-0.5">
            {isPageAction ? c.pageActionOption.startUrl : c.searchUrl}
          </p>
        </div>
      </button>
    </li>
  )
}
