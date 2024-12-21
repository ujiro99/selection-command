import React, { useEffect, useCallback } from 'react'
import { useSetting } from '@/hooks/useSetting'
import { sendEvent } from '@/services/analytics'
import { SCREEN } from '@/const'
import { useDetectUrlChanged } from '@/hooks/useDetectUrlChanged'
import { Ipc, BgCommand } from '@/services/ipc'

function isButtonElement(elm: Element): elm is HTMLButtonElement {
  return elm.tagName?.toLowerCase() === 'button'
}

function findButtonElement(elm: Element): HTMLButtonElement | undefined {
  if (elm == null) return undefined
  if (elm.nodeName === 'body') return undefined
  if (isButtonElement(elm)) return elm
  return findButtonElement(elm.parentElement as Element)
}

export const StarButton = (): JSX.Element => {
  const { settings } = useSetting()
  const stars = settings.stars
  const { addUrlChangeListener, removeUrlChangeListener } =
    useDetectUrlChanged()

  const updateStar = useCallback(
    (e: MouseEvent) => {
      const button = findButtonElement(e.target as Element)
      const id = button?.dataset.starId
      if (id == null) return
      const found = stars.includes(id)
      sendEvent(
        `command_hub_star_${found ? 'remove' : 'add'}`,
        { id },
        SCREEN.COMMAND_HUB,
      )
      Ipc.send(BgCommand.toggleStar, { id })
    },
    [stars],
  )

  const updateButton = () => {
    document.querySelectorAll('button[data-star-id]').forEach((button) => {
      if (!(button instanceof HTMLButtonElement)) return
      const id = button.dataset.starId
      if (id == null) return
      button.addEventListener('click', updateStar)
      if (stars.includes(id)) {
        button.classList.add('starred')
      } else {
        button.classList.remove('starred')
      }
    })
  }

  const removeButtonEvent = () => {
    document.querySelectorAll('button[data-star-id]').forEach((button) => {
      if (!(button instanceof HTMLButtonElement)) return
      button.removeEventListener('click', updateStar)
    })
  }

  useEffect(() => {
    updateButton()
    addUrlChangeListener(updateButton)
    return () => {
      removeUrlChangeListener(updateButton)
      removeButtonEvent()
    }
  }, [stars])

  return <></>
}
