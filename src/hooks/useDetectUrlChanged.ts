import { useState, useEffect } from 'react'

type Listener = () => void
type Listeners = Listener[]

export function useDetectUrlChanged() {
  const [listener, setListener] = useState<Listeners>([])

  const addUrlChangeListener = (l: Listener) => {
    setListener((prev) => [...prev, l])
  }

  const removeUrlChangeListener = (l: Listener) => {
    setListener((prev) => prev.filter((f) => f !== l))
  }

  useEffect(() => {
    const observeUrlChange = () => {
      let oldHref = document.location.href
      const body = document.querySelector('body')
      const observer = new MutationObserver(() => {
        if (oldHref !== document.location.href) {
          oldHref = document.location.href
          listener.forEach((l) => l())
        }
      })
      observer.observe(body as Node, { childList: true, subtree: true })
      return observer
    }
    const observer = observeUrlChange()
    return () => observer.disconnect()
  }, [listener])

  return { addUrlChangeListener, removeUrlChangeListener }
}
