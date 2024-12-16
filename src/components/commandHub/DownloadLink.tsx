import React, { useState, useEffect, useRef } from 'react'
import clsx from 'clsx'
import { Point } from '@/types'
import { Ipc, BgCommand } from '@/services/ipc'
import { useSetting } from '@/hooks/useSetting'
import { sendEvent } from '@/services/analytics'
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
  PopoverArrow,
} from '@/components/ui/popover'
import { SCREEN } from '@/const'
import { useDetectUrlChanged } from '@/hooks/useDetectUrlChanged'

import '@/components/global.css'

const TooltipDuration = 2000

export const DownloadLink = (): JSX.Element => {
  const [posision, setPosition] = useState<Point | null>(null)
  const { settings } = useSetting()
  const { addUrlChangeListener, removeUrlChangeListener } =
    useDetectUrlChanged()
  const commands = settings.commands
  const [shouldRender, setShouldRender] = useState(false)
  const open = posision != null
  const ref = useRef<HTMLDivElement>(null)

  const setButtonClickListener = () => {
    document.querySelectorAll('button[data-command]').forEach((button) => {
      if (!(button instanceof HTMLButtonElement)) return
      button.style.display = 'block' // show hidden buttons
      const command = button.dataset.command
      const id = button.dataset.id
      if (command == null) return
      button.addEventListener('click', (e) => {
        Ipc.send(BgCommand.addCommand, { command }).then((res) => {
          if (res) {
            sendEvent('command_hub_add', { id }, SCREEN.COMMAND_HUB)
            setPosition({ x: e.clientX, y: e.clientY })
          }
        })
      })
    })
  }

  const updateButtonVisibility = () => {
    const ids = commands.map((c) => c.id)
    ids.forEach((id) => {
      // hide installed buttons
      const installed = document.querySelector(
        `button[data-id="${id}"]`,
      ) as HTMLElement
      if (installed) installed.style.display = 'none'
      // show installed label
      const p = document.querySelector(`p[data-id="${id}"]`) as HTMLElement
      if (p) p.style.display = 'block'
    })
  }

  useEffect(() => {
    setButtonClickListener()
    updateButtonVisibility()
    addUrlChangeListener(setButtonClickListener)
    addUrlChangeListener(updateButtonVisibility)
    return () => {
      removeUrlChangeListener(setButtonClickListener)
    }
  }, [])

  useEffect(() => {
    updateButtonVisibility()
    addUrlChangeListener(updateButtonVisibility)
    return () => {
      removeUrlChangeListener(updateButtonVisibility)
    }
  }, [commands])

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => setPosition(null), TooltipDuration)
    return () => {
      clearTimeout(timer)
    }
  }, [open])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (open) {
      timer = setTimeout(() => {
        setShouldRender(true)
      }, 100)
    } else {
      setShouldRender(false)
    }
    return () => clearTimeout(timer)
  }, [open])

  const styles = {
    position: 'absolute',
    height: 20,
    width: 20,
    top: (posision?.y ?? 0) - 10,
    left: (posision?.x ?? 0) - 10,
    zIndex: 2147483647,
    // border: '1px solid red',
  } as React.CSSProperties

  return (
    <>
      <div style={styles} ref={ref} />
      <Popover open={open}>
        <PopoverAnchor virtualRef={{ current: ref.current }} />
        {shouldRender && (
          <PopoverContent
            className={clsx(
              'bg-stone-800 min-w-4 px-2 py-1.5 text-xs text-white shadow-md',
            )}
            side="top"
            arrowPadding={-1}
          >
            Command added!
            <PopoverArrow className="fill-gray-800" height={6} />
          </PopoverContent>
        )}
      </Popover>
    </>
  )
}
