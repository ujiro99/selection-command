import { useState, ReactNode, useEffect } from "react"
import { Storage, SESSION_STORAGE_KEY } from "@/services/storage"
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

  useEffect(() => {
    const setSelectionText = async (text: string) => {
      _setSelectionText(text)
      await Storage.set<string>(SESSION_STORAGE_KEY.SELECTION_TEXT, text)
    }

    const onSelectionchange = async () => {
      if (!detectSelectionEnabled) return
      const text = getSelectionText()
      await setSelectionText(text)
    }

    document.addEventListener("selectionchange", onSelectionchange)
    return () => {
      document.removeEventListener("selectionchange", onSelectionchange)
    }
  }, [detectSelectionEnabled])

  const value: ContextType = {
    selectionText,
    target,
    setTarget,
    setDetectSelectionEnabled,
  }

  return (
    <selectContext.Provider value={value}>{children}</selectContext.Provider>
  )
}
