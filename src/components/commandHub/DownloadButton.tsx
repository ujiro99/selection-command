import React, { useState, useEffect } from 'react'
import clsx from 'clsx'
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

export const DownloadButton = (): JSX.Element => {
  const [position, setPosition] = useState<Element | null>(null)
  const { settings } = useSetting()
  const { addUrlChangeListener, removeUrlChangeListener } =
    useDetectUrlChanged()
  const commands = settings.commands
  const [shouldRender, setShouldRender] = useState(false)
  const open = position != null

  const setButtonClickListener = () => {
    document.querySelectorAll('button[data-command]').forEach((button) => {
      if (!(button instanceof HTMLButtonElement)) return
      button.style.display = 'block' // show hidden buttons
      const command = button.dataset.command
      const id = button.dataset.id
      if (command == null) return
      button.addEventListener('click', () => {
        Ipc.send(BgCommand.addCommand, { command }).then((res) => {
          if (res) {
            sendEvent('command_hub_add', { id }, SCREEN.COMMAND_HUB)
            setPosition(button.parentElement)
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

  const updateCount = () => {
    document.querySelectorAll('span[data-id]').forEach((span) => {
      if (!(span instanceof HTMLElement)) return
      const count = Number(span.dataset.downloadCount)
      if (count == null || isNaN(count)) return
      let reviced = 0
      const cmd = commands.find((c) => c.id === span.dataset.id)
      if (cmd != null) {
        // There is a command.
        reviced++
      }
      span.textContent = (count + reviced).toLocaleString()
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
    updateCount()
    addUrlChangeListener(updateButtonVisibility)
    addUrlChangeListener(updateCount)
    return () => {
      removeUrlChangeListener(updateButtonVisibility)
      removeUrlChangeListener(updateCount)
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

  return (
    <Popover open={open}>
      <PopoverAnchor virtualRef={{ current: position }} />
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
  )
}
