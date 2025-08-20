import { createContext, useContext } from "react"

export type ContextType = {
  tabId: number | null
  isLoading: boolean
  error: Error | null
}

export const tabContext = createContext<ContextType>({} as ContextType)

export const useTabContext = () => {
  return useContext(tabContext)
}
