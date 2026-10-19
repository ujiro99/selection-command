import { useState, ReactNode, useEffect, useCallback, useRef } from "react"
import { Ipc, TabCommand, type TabSelection } from "@/services/ipc"
import { getSelectionText } from "@/services/dom"
import { ContextType, selectContext } from "@/hooks/useSelectContext"

export const SelectContextProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const [selectionText, _setSelectionText] = useState("")
  const [target, setTarget] = useState<Element | null>(null)
  const [detectSelectionEnabled, setDetectSelectionEnabled] = useState(true)
  const selectionRef = useRef<TabSelection>({ text: "", focusLost: false })

  const setSelectionText = useCallback((text: string) => {
    _setSelectionText(text)
    selectionRef.current = { text, focusLost: false }
  }, [])

  useEffect(() => {
    const onSelectionchange = () => {
      if (!detectSelectionEnabled) return
      setSelectionText(getSelectionText())
    }

    document.addEventListener("selectionchange", onSelectionchange)
    return () => {
      document.removeEventListener("selectionchange", onSelectionchange)
    }
  }, [detectSelectionEnabled, setSelectionText])

  useEffect(() => {
    // The selection stays in the page after the window loses focus, so the
    // shortcut handler in the service worker needs to know it to decide
    // whether to use the selection or the clipboard.
    const onBlur = () => {
      selectionRef.current = { ...selectionRef.current, focusLost: true }
    }
    window.addEventListener("blur", onBlur)

    Ipc.addListener(TabCommand.getSelection, (_param, _sender, response) => {
      response(selectionRef.current)
      return true
    })

    return () => {
      window.removeEventListener("blur", onBlur)
      Ipc.removeListener(TabCommand.getSelection)
    }
  }, [])

  const value: ContextType = {
    selectionText,
    setSelectionText,
    target,
    setTarget,
    setDetectSelectionEnabled,
  }

  return (
    <selectContext.Provider value={value}>{children}</selectContext.Provider>
  )
}
