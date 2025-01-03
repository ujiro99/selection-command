import { useEffect, useCallback, useRef } from 'react'
import { OPTION_MSG, KEYBOARD, STARTUP_METHOD } from '@/const'
import type { SettingsType } from '@/types'

const allowdKeys = Object.values(KEYBOARD)

export function useEventProxy(
  sendMessage: (msg: OPTION_MSG, value: any) => void,
  settings?: SettingsType,
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  // Keyboard Event
  useEffect(() => {
    const handleKeyUp = (event: KeyboardEvent) => {
      if (allowdKeys.includes(event.key as KEYBOARD)) {
        sendMessage(OPTION_MSG.KEY_INPUT, event.key)
      }
    }
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [sendMessage])

  // Mouse Event
  useEffect(() => {
    if (settings?.startupMethod.method !== STARTUP_METHOD.LEFT_CLICK_HOLD) {
      return
    }
    const handleMouseDown = (event: MouseEvent) => {
      sendMessage(OPTION_MSG.MOUSE, {
        event: 'mousedown',
        button: event.button,
      })
    }
    const handleMouseUp = (event: MouseEvent) => {
      sendMessage(OPTION_MSG.MOUSE, { event: 'mouseup', button: event.button })
      clearTimeout(timeoutRef.current)
    }
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [sendMessage, settings])
}

export function useEventProxyReceiver() {
  const func = useCallback(async (event: MessageEvent) => {
    const command = event.data.command
    const value = event.data.value
    if (command === OPTION_MSG.KEY_INPUT) {
      window.dispatchEvent(new KeyboardEvent('keyup', { key: value }))
    } else if (command === OPTION_MSG.MOUSE) {
      window.dispatchEvent(
        new MouseEvent(value.event, {
          bubbles: true,
          cancelable: true,
          view: window,
          button: value.button,
        }),
      )
    }
  }, [])

  useEffect(() => {
    window.addEventListener('message', func)
    return () => {
      window.removeEventListener('message', func)
    }
  }, [])
}
