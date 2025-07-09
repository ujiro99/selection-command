import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react"
import { Storage, SESSION_STORAGE_KEY } from "@/services/storage"
import { getSelectionText } from "@/services/dom"

type ContextType = {
  selectionText: string
  target: Element | null
  setTarget: (elm: Element | null) => void
}

const context = createContext<ContextType>({} as ContextType)

export const SelectContextProvider = ({
  children,
  isPopupHover,
}: {
  children: ReactNode
  isPopupHover: boolean
}) => {
  const [selectionText, _setSelectionText] = useState("")
  const [target, setTarget] = useState<Element | null>(null)

  const setSelectionText = async (text: string) => {
    _setSelectionText(text)
    await Storage.set<string>(SESSION_STORAGE_KEY.SELECTION_TEXT, text)
  }

  useEffect(() => {
    const onSelectionchange = async () => {
      if (isPopupHover) return
      const text = getSelectionText()
      await setSelectionText(text)
    }
    document.addEventListener("selectionchange", onSelectionchange)
    return () => {
      document.removeEventListener("selectionchange", onSelectionchange)
    }
  }, [isPopupHover, setSelectionText])

  return (
    <context.Provider value={{ selectionText, target, setTarget }}>
      {children}
    </context.Provider>
  )
}

export const useSelectContext = () => {
  const { selectionText, target, setTarget } = useContext(context)
  return {
    selectionText,
    target,
    setTarget,
  }
}
