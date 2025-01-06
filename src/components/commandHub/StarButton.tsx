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
      const found = stars.some((s) => s.id === id)
      sendEvent(
        `command_hub_star_${found ? 'remove' : 'add'}`,
        { id },
        SCREEN.COMMAND_HUB,
      )
      Ipc.send(BgCommand.toggleStar, { id })
    },
    [stars],
  )

  const updateButton = useCallback(() => {
    document.querySelectorAll('button[data-star-id]').forEach((button) => {
      if (!(button instanceof HTMLButtonElement)) return
      const id = button.dataset.starId
      if (id == null) return
      button.addEventListener('click', updateStar)
      button.dataset.clickable = 'true'
      if (stars.some((s) => s.id === id)) {
        button.dataset.starred = 'true'
      } else {
        button.dataset.starred = 'false'
      }
    })
  }, [stars])

  const updateCount = () => {
    document.querySelectorAll('span[data-star-id]').forEach((span) => {
      if (!(span instanceof HTMLElement)) return
      const count = Number(span.dataset.starCount)
      if (count == null || isNaN(count)) return
      let reviced = 0
      const star = stars.find((s) => s.id === span.dataset.starId)
      if (star != null) {
        // There is a new star.
        reviced++
      }
      span.textContent = (count + reviced).toLocaleString()
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
    updateCount()
    addUrlChangeListener(updateButton)
    addUrlChangeListener(updateCount)
    return () => {
      removeUrlChangeListener(updateButton)
      removeUrlChangeListener(updateCount)
      removeButtonEvent()
    }
  }, [stars])

  return <></>
}
