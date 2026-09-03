import { useState, ReactNode, useEffect, useCallback } from "react"
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

  const setSelectionText = useCallback(async (text: string) => {
    _setSelectionText(text)
    await Storage.set<string>(SESSION_STORAGE_KEY.SELECTION_TEXT, text)
  }, [])

  useEffect(() => {
    const onSelectionchange = async () => {
      if (!detectSelectionEnabled) return
      const text = getSelectionText()
      await setSelectionText(text)
    }

    document.addEventListener("selectionchange", onSelectionchange)
    return () => {
      document.removeEventListener("selectionchange", onSelectionchange)
    }
  }, [detectSelectionEnabled, setSelectionText])

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
