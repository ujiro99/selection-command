import { useState, ReactNode, useEffect } from "react"
import { Storage, SESSION_STORAGE_KEY } from "@/services/storage"
import { getSelectionText } from "@/services/dom"
import { ContextType, selectContext } from "@/hooks/useSelectContext"

export const SelectContextProvider = ({
  children,
  isPopupHover,
}: {
  children: ReactNode
  isPopupHover: boolean
}) => {
  const [selectionText, _setSelectionText] = useState("")
  const [target, setTarget] = useState<Element | null>(null)

  useEffect(() => {
    const setSelectionText = async (text: string) => {
      _setSelectionText(text)
      await Storage.set<string>(SESSION_STORAGE_KEY.SELECTION_TEXT, text)
    }

    const onSelectionchange = async () => {
      if (isPopupHover) return
      const text = getSelectionText()
      await setSelectionText(text)
    }

    document.addEventListener("selectionchange", onSelectionchange)
    return () => {
      document.removeEventListener("selectionchange", onSelectionchange)
    }
  }, [isPopupHover])

  const value: ContextType = {
    selectionText,
    target,
    setTarget,
  }

  return (
    <selectContext.Provider value={value}>{children}</selectContext.Provider>
  )
}
