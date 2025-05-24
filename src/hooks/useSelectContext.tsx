import { createContext, useContext, useState, ReactNode } from 'react'
import { Storage, SESSION_STORAGE_KEY } from '@/services/storage'

type ContextType = {
  selectionText: string
  setSelectionText: (text: string) => Promise<void>
  target: Element | null
  setTarget: (elm: Element | null) => void
}

const context = createContext<ContextType>({} as ContextType)

export const SelectContextProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const [selectionText, _setSelectionText] = useState('')
  const [target, setTarget] = useState<Element | null>(null)

  const setSelectionText = async (text: string) => {
    _setSelectionText(text)
    await Storage.set<string>(SESSION_STORAGE_KEY.SELECTION_TEXT, text)
  }

  return (
    <context.Provider
      value={{ selectionText, setSelectionText, target, setTarget }}
    >
      {children}
    </context.Provider>
  )
}

export const useSelectContext = () => {
  const { selectionText, setSelectionText, target, setTarget } =
    useContext(context)
  return {
    selectionText,
    setSelectionText,
    target,
    setTarget,
  }
}
