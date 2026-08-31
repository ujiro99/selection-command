import { createContext, useContext } from "react"

export type ContextType = {
  selectionText: string
  target: Element | null
  setTarget: (elm: Element | null) => void
  setDetectSelectionEnabled: (enabled: boolean) => void
}

export const selectContext = createContext<ContextType>({} as ContextType)

export const useSelectContext = () => {
  return useContext(selectContext)
}
