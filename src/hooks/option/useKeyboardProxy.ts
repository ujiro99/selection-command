import { useEffect } from 'react'
import { OPTION_MSG, KEYBOARD } from '@/const'

const allowdKeys = Object.values(KEYBOARD)

export function useKeyboardProxy(
  sendMessage: (msg: OPTION_MSG, value: any) => void,
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (allowdKeys.includes(event.key as KEYBOARD)) {
        sendMessage(OPTION_MSG.KEY_INPUT, event.key)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [sendMessage])
}
