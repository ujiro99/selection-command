import { createContext, useContext } from 'react'

type ContextType = {
  selectionText: string
  target: Element | null
  setTarget: (elm: Element | null) => void
}

const context = createContext<ContextType>({} as ContextType)

export const SelectContextProvider = context.Provider

export const useSelectContext = () => {
  const { selectionText, target, setTarget } = useContext(context)
  return {
    selectionText,
    target,
    setTarget,
  }
}
