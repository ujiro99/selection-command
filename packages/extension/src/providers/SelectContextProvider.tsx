import { useState, ReactNode, useEffect, useCallback, useRef } from "react"
import { Ipc, TabCommand } from "@/services/ipc"
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
  const selectionRef = useRef("")

  const setSelectionText = useCallback((text: string) => {
    _setSelectionText(text)
    selectionRef.current = text
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
    Ipc.addListener(TabCommand.getSelection, (_param, _sender, response) => {
      response(selectionRef.current)
      return true
    })

    return () => {
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
