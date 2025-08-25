import { createContext, useContext } from "react"
import type { PageActionContext } from "@/types"

type ContextType = PageActionContext & {
  setContextData: (data: PageActionContext) => Promise<void>
}

export const pageActionContext = createContext<ContextType>({} as ContextType)

export const usePageActionContext = (): ContextType => {
  return useContext(pageActionContext)
}
